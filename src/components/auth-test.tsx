'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTestAuthQuery } from '@/store/api/userApi'

export function AuthTest() {
  const [testResult, setTestResult] = useState<string>('')
  const { data, error, isLoading, refetch } = useTestAuthQuery()

  const handleTest = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      setTestResult(`Token in localStorage: ${token ? 'YES' : 'NO'}`)
      
      if (token) {
        setTestResult(prev => prev + `\nToken preview: ${token.substring(0, 20)}...`)
      }
      
      await refetch()
    } catch (err) {
      setTestResult(`Error: ${err}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Authentication Test</h3>
      
      <Button onClick={handleTest} disabled={isLoading}>
        {isLoading ? 'Testing...' : 'Test Auth'}
      </Button>
      
      <div className="text-sm">
        <p><strong>Test Result:</strong></p>
        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded">
          {testResult}
        </pre>
      </div>
      
      <div className="text-sm">
        <p><strong>API Response:</strong></p>
        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded">
          {error ? `Error: ${JSON.stringify(error, null, 2)}` : 
           data ? JSON.stringify(data, null, 2) : 'No data'}
        </pre>
      </div>
    </div>
  )
}




