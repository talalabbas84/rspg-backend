from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app import schemas, models
from app.crud import crud_global_list
from app.api import deps
from app.db.session import get_db

router = APIRouter()

# --------- Global List Routes ---------

@router.post("/", response_model=schemas.GlobalListRead, status_code=status.HTTP_201_CREATED)
async def create_global_list(
    *,
    db: AsyncSession = Depends(get_db),
    list_in: schemas.GlobalListCreate,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    existing_list = await db.execute(
        select(models.GlobalList).filter(
            models.GlobalList.name == list_in.name, 
            models.GlobalList.user_id == current_user.id
        )
    )
    if existing_list.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Global list with name '{list_in.name}' already exists."
        )
    glist = await crud_global_list.global_list.create_with_owner(
        db=db, obj_in=list_in, user_id=current_user.id
    )
    return glist

@router.get("/", response_model=List[schemas.GlobalListRead])
async def read_global_lists(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    glists = await crud_global_list.global_list.get_multi_by_owner(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return glists

@router.get("/{list_id}", response_model=schemas.GlobalListRead)
async def read_global_list(
    *,
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    glist = await crud_global_list.global_list.get_by_id_and_owner(
        db, id=list_id, user_id=current_user.id
    )
    if not glist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Global list not found or not owned by user"
        )
    return glist

@router.put("/{list_id}", response_model=schemas.GlobalListRead)
async def update_global_list(
    *,
    list_id: int,
    list_in: schemas.GlobalListUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    glist = await crud_global_list.global_list.get_by_id_and_owner(db, id=list_id, user_id=current_user.id)
    if not glist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Global list not found or not owned by user")

    if list_in.name and list_in.name != glist.name:
        existing_list = await db.execute(
            select(models.GlobalList).filter(models.GlobalList.name == list_in.name, models.GlobalList.user_id == current_user.id)
        )
        if existing_list.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Global list with name '{list_in.name}' already exists.")

    glist.name = list_in.name or glist.name
    glist.description = list_in.description if list_in.description is not None else glist.description

    # Wipe all current items and insert new ones
    if hasattr(list_in, "items") and list_in.items is not None:
        await db.execute(
            models.GlobalListItem.__table__.delete().where(models.GlobalListItem.global_list_id == glist.id)
        )
        await db.flush()  # flush deletes before inserts

        # Insert new items
        for idx, item_in in enumerate(list_in.items):
            value = getattr(item_in, "value", None)
            order = getattr(item_in, "order", idx)
            db_item = models.GlobalListItem(
                value=value,
                order=order if order is not None else idx,
                global_list_id=glist.id
            )
            db.add(db_item)

        await db.flush()   # <--- CRUCIAL: flush new items so next query sees them
        await db.commit()  # commit everything

        # EXPUNGE glist to force reload on next query (sometimes needed)
        await db.refresh(glist)  # Ensure latest version is loaded

        # Re-query, with eager loading
        refreshed = await db.execute(
            select(models.GlobalList)
            .options(selectinload(models.GlobalList.items))
            .filter(models.GlobalList.id == glist.id)
        )
        return refreshed.scalar_one()
    else:
        # No items update: just commit/refresh and return
        await db.commit()
        await db.refresh(glist)
        refreshed = await db.execute(
            select(models.GlobalList)
            .options(selectinload(models.GlobalList.items))
            .filter(models.GlobalList.id == glist.id)
        )
        return refreshed.scalar_one()



@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_global_list(
    *,
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> None:
    glist = await crud_global_list.global_list.get_by_id_and_owner(
        db, id=list_id, user_id=current_user.id
    )
    if not glist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Global list not found or not owned by user"
        )
    await crud_global_list.global_list.remove(db, id=list_id)
    return None

# --------- Global List Item Routes ---------

async def get_owned_global_list_for_item_ops(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> models.GlobalList:
    glist = await crud_global_list.global_list.get_by_id_and_owner(
        db, id=list_id, user_id=current_user.id
    )
    if not glist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Parent global list not found or not owned by user"
        )
    return glist

@router.post("/{list_id}/items/", response_model=schemas.GlobalListItemRead, status_code=status.HTTP_201_CREATED)
async def create_global_list_item(
    *,
    list_id: int,
    item_in: schemas.GlobalListItemCreate,
    owned_list: models.GlobalList = Depends(get_owned_global_list_for_item_ops),
    db: AsyncSession = Depends(get_db)
) -> Any:
    item = await crud_global_list.global_list_item.create_for_list(
        db=db, obj_in=item_in, global_list_id=owned_list.id
    )
    return item

@router.get("/{list_id}/items/", response_model=List[schemas.GlobalListItemRead])
async def read_global_list_items(
    *,
    list_id: int,
    owned_list: models.GlobalList = Depends(get_owned_global_list_for_item_ops),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 1000
) -> Any:
    items = await crud_global_list.global_list_item.get_multi_by_list(
        db, global_list_id=owned_list.id, skip=skip, limit=limit
    )
    return items

@router.put("/items/{item_id}", response_model=schemas.GlobalListItemRead)
async def update_global_list_item(
    *,
    item_id: int,
    item_in: schemas.GlobalListItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    db_item = await crud_global_list.global_list_item.get(db, id=item_id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Global list item not found"
        )
    # Ownership check for parent list
    _ = await get_owned_global_list_for_item_ops(
        list_id=db_item.global_list_id, db=db, current_user=current_user
    )
    item = await crud_global_list.global_list_item.update(
        db, db_obj=db_item, obj_in=item_in
    )
    return item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_global_list_item(
    *,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> None:
    db_item = await crud_global_list.global_list_item.get(db, id=item_id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Global list item not found"
        )
    _ = await get_owned_global_list_for_item_ops(
        list_id=db_item.global_list_id, db=db, current_user=current_user
    )
    await crud_global_list.global_list_item.remove(db, id=item_id)
    return None
