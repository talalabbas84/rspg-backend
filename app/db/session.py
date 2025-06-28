# (Content from previous response - unchanged and correct)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Ensure the DATABASE_URL is compatible with asyncpg for PostgreSQL
# For SQLite, it should be like: "sqlite+aiosqlite:///./test.db"
db_url = settings.DATABASE_URL
if "postgresql://" in db_url and "postgresql+asyncpg://" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")


engine = create_async_engine(db_url, pool_pre_ping=True, echo=False) # Set echo=True for SQL logging
AsyncSessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
