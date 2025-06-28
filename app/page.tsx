"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { CreateSequenceModal } from "@/components/modals/create-sequence-modal"
import { SequencesList } from "@/components/sequences/sequences-list"
import { GlobalVariablesList } from "@/components/variables/global-variables-list" // Assuming this is for sequence-specific globals
import { GlobalListsList } from "@/components/lists/global-lists-list" // For user-level global lists
import { CreateListModal } from "@/components/modals/create-list-modal"
import { CreateVariableModal } from "@/components/modals/create-variable-modal" // For user-level global variables
import { Loader2, PlusCircle } from "lucide-react"
import { useState } from "react"

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showCreateSequenceModal, setShowCreateSequenceModal] = useState(false)
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [showCreateVariableModal, setShowCreateVariableModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login") // Or your dedicated login page
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-gray-700" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome, {user?.name || "User"}!</h1>
          <p className="text-sm text-gray-600">Manage your AI sequences and global resources.</p>
        </div>
        {/* Add global actions if any, e.g., settings, profile */}
      </header>

      {/* Sequences Section */}
      <section className="space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-700">My Sequences</h2>
          <Button
            onClick={() => setShowCreateSequenceModal(true)}
            size="sm"
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Sequence
          </Button>
        </div>
        <SequencesList />
      </section>

      {/* Global Lists Section */}
      <section className="space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-700">My Global Lists</h2>
          <Button
            onClick={() => setShowCreateListModal(true)}
            size="sm"
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Global List
          </Button>
        </div>
        <GlobalListsList />
      </section>

      {/* Global Variables Section - Assuming these are user-level global variables, not sequence-specific */}
      {/* If GlobalVariablesList is for sequence-specific, it should be on the sequence page */}
      {/* For now, let's assume it's for user-level global string variables */}
      <section className="space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-700">My Global Variables</h2>
          <Button
            onClick={() => setShowCreateVariableModal(true)}
            size="sm"
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Global Variable
          </Button>
        </div>
        <GlobalVariablesList />
      </section>

      {/* Modals */}
      <CreateSequenceModal open={showCreateSequenceModal} onOpenChange={setShowCreateSequenceModal} />
      <CreateListModal open={showCreateListModal} onOpenChange={setShowCreateListModal} />
      <CreateVariableModal
        open={showCreateVariableModal}
        onOpenChange={setShowCreateVariableModal}
        sequenceId={null} // Indicate it's a global variable not tied to a sequence
        variableType="global" // Explicitly set type
        // onVariableCreated might need to trigger a refetch of global variables if not handled by a dedicated hook
      />
    </div>
  )
}
