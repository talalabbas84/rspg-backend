"use client"

import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function SequenceResponse() {
  return (
    <div className="space-y-6">
      {/* Overall Response */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Response</h3>
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg font-mono">
          yesyesnoyesnoyesnoyesnononoyesnoyesno
        </div>
      </div>

      {/* Block 1 Response */}
      <Card className="p-6 bg-white border border-gray-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium text-gray-900">Response:</h4>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500">Processing...</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Compiled Prompt:</div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                Make 5 claims for a biometric water bottle. 1 independent and 4 dependent.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Discretization Block Response */}
      <Card className="p-6 bg-white border border-gray-200">
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-900">Response:</h4>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Outputs:</div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((output) => (
                <div key={output} className="border-l-4 border-blue-200 pl-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Output {output}:</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {output === 1 &&
                      "A biometric water bottle comprising: a container body, a sensor array measuring hydration biomarkers, a display screen, and a processor analyzing collected data"}
                    {output === 2 &&
                      "The biometric water bottle of claim 1, wherein the sensor array includes saliva and pH sensors"}
                    {output === 3 &&
                      "The biometric water bottle of claim 1, wherein the display screen shows real-time hydration levels"}
                    {output === 4 &&
                      "The biometric water bottle of claim 1, further comprising wireless connectivity for data transmission"}
                    {output === 5 &&
                      "The biometric water bottle of claim 1, wherein the processor generates personalized hydration recommendations"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Multi List Output */}
      <Card className="p-6 bg-white border border-gray-200">
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-900">Response:</h4>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Multi List Output:</div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((group) => (
                <div key={group} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-3">Group {group}:</div>
                  <div className="grid grid-cols-1 gap-2 ml-4">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-gray-600">Item 1:</span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          group <= 3 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {group <= 3 ? "yes" : "no"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-gray-600">Item 2:</span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          group === 1 || group === 3 || group === 5
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {group === 1 || group === 3 || group === 5 ? "yes" : "no"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-gray-600">Item 3:</span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          group === 3 || group === 5 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {group === 3 || group === 5 ? "yes" : "no"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
