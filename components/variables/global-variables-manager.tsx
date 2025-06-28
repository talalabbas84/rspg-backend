"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, List, VariableIcon } from "lucide-react"
import type { Variable, GlobalList } from "@/types"

interface GlobalVariablesManagerProps {
  sequenceId: string
}

export function GlobalVariablesManager({ sequenceId }: GlobalVariablesManagerProps) {
  const [variables, setVariables] = useState<Variable[]>([
    {
      id: "1",
      name: "global_context",
      value: "Patent application for biometric water bottle",
      type: "global",
      description: "Main context for the patent application",
    },
    {
      id: "2",
      name: "user_input",
      value: "Smart water bottle with health tracking",
      type: "input",
      description: "User-provided input for the sequence",
    },
  ])

  const [globalLists, setGlobalLists] = useState<GlobalList[]>([
    {
      id: "1",
      name: "claim_types",
      values: ["independent", "dependent", "method", "system"],
      description: "Types of patent claims",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  const [showCreateVariable, setShowCreateVariable] = useState(false)
  const [showCreateList, setShowCreateList] = useState(false)
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null)
  const [editingList, setEditingList] = useState<GlobalList | null>(null)

  const [newVariable, setNewVariable] = useState({
    name: "",
    value: "",
    type: "global" as Variable["type"],
    description: "",
  })

  const [newList, setNewList] = useState({
    name: "",
    values: "",
    description: "",
  })

  const handleCreateVariable = () => {
    const variable: Variable = {
      id: Date.now().toString(),
      sequence_id: sequenceId,
      name: newVariable.name,
      value: newVariable.value,
      type: newVariable.type,
      description: newVariable.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setVariables([...variables, variable])
    setNewVariable({ name: "", value: "", type: "global", description: "" })
    setShowCreateVariable(false)
  }

  const handleCreateList = () => {
    const list: GlobalList = {
      id: Date.now().toString(),
      name: newList.name,
      values: newList.values.split("\n").filter((v) => v.trim()),
      description: newList.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setGlobalLists([...globalLists, list])
    setNewList({ name: "", values: "", description: "" })
    setShowCreateList(false)
  }

  const handleDeleteVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id))
  }

  const handleDeleteList = (id: string) => {
    setGlobalLists(globalLists.filter((l) => l.id !== id))
  }

  const getVariableTypeColor = (type: Variable["type"]) => {
    switch (type) {
      case "global":
        return "bg-blue-100 text-blue-800"
      case "input":
        return "bg-green-100 text-green-800"
      case "output":
        return "bg-purple-100 text-purple-800"
      case "list":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Global Variables & Lists</h2>
        <div className="flex gap-2">
          <Dialog open={showCreateVariable} onOpenChange={setShowCreateVariable}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <VariableIcon className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Global Variable</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Variable Name</Label>
                  <Input
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                    placeholder="e.g., global_context"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newVariable.type}
                    onValueChange={(value: Variable["type"]) => setNewVariable({ ...newVariable, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global Variable</SelectItem>
                      <SelectItem value="input">Input Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Textarea
                    value={newVariable.value}
                    onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                    placeholder="Enter the variable value..."
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={newVariable.description}
                    onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                    placeholder="Brief description of this variable"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateVariable(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVariable}>Create Variable</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" />
                Add List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Global List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>List Name</Label>
                  <Input
                    value={newList.name}
                    onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                    placeholder="e.g., claim_types"
                  />
                </div>
                <div>
                  <Label>Values (one per line)</Label>
                  <Textarea
                    value={newList.values}
                    onChange={(e) => setNewList({ ...newList, values: e.target.value })}
                    placeholder="independent&#10;dependent&#10;method&#10;system"
                    rows={6}
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={newList.description}
                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                    placeholder="Brief description of this list"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateList(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateList}>Create List</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="variables" className="w-full">
        <TabsList>
          <TabsTrigger value="variables">Variables ({variables.length})</TabsTrigger>
          <TabsTrigger value="lists">Lists ({globalLists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="variables" className="space-y-4">
          {variables.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No global variables created yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateVariable(true)}>
                Create Your First Variable
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {variables.map((variable) => (
                <Card key={variable.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {"<<"}
                          {variable.name}
                          {">>"}
                        </code>
                        <Badge className={getVariableTypeColor(variable.type)}>{variable.type}</Badge>
                      </div>
                      {variable.description && <p className="text-sm text-gray-600">{variable.description}</p>}
                      <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                        {variable.value.length > 100 ? `${variable.value.substring(0, 100)}...` : variable.value}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditingVariable(variable)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteVariable(variable.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          {globalLists.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No global lists created yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateList(true)}>
                Create Your First List
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {globalLists.map((list) => (
                <Card key={list.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{list.name}</code>
                        <Badge className="bg-orange-100 text-orange-800">{list.values.length} items</Badge>
                      </div>
                      {list.description && <p className="text-sm text-gray-600">{list.description}</p>}
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex flex-wrap gap-1">
                          {list.values.slice(0, 5).map((value, index) => (
                            <span key={index} className="bg-white px-2 py-1 rounded border text-xs">
                              {value}
                            </span>
                          ))}
                          {list.values.length > 5 && (
                            <span className="text-gray-500 text-xs">+{list.values.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditingList(list)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteList(list.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
