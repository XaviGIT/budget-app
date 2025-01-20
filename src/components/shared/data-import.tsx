"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { importCategories } from "@/lib/importers/category-importer"
import { importAccounts } from "@/lib/importers/account-importer"
import { importPayees } from "@/lib/importers/payee-importer"
import { importTransactions } from "@/lib/importers/transaction-importer"

type ImportStatus = {
  categories?: { success: boolean; imported?: number; error?: string }
  accounts?: { success: boolean; imported?: number; error?: string }
  payees?: { success: boolean; imported?: number; error?: string }
  transactions?: { success: boolean; imported?: number; error?: string }
}

export function DataImport() {
  const [status, setStatus] = useState<ImportStatus>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (
    type: 'categories' | 'accounts' | 'payees' | 'transactions',
    file: File
  ) => {
    setIsLoading(true)
    try {
      const text = await file.text()
      let result

      switch (type) {
        case 'categories':
          result = await importCategories(text)
          break
        case 'accounts':
          result = await importAccounts(text)
          break
        case 'payees':
          result = await importPayees(text)
          break
        case 'transactions':
          result = await importTransactions(text)
          break
      }

      setStatus(prev => ({ ...prev, [type]: result }))
    } catch (error) {
      console.error(`Error importing ${type}:`, error)
      setStatus(prev => ({
        ...prev,
        [type]: {
          success: false,
          error: error instanceof Error ? error.message : 'Import failed'
        }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const ImportButton = ({ type, label }: { type: keyof ImportStatus; label: string }) => (
    <div className="space-y-2">
      <input
        type="file"
        accept=".csv"
        onChange={async (e) => {
          if (e.target.files?.[0]) {
            await handleFileUpload(type, e.target.files[0])
            e.target.value = '' // Reset file input
          }
        }}
        className="hidden"
        id={`${type}-upload`}
      />
      <Button
        onClick={() => document.getElementById(`${type}-upload`)?.click()}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Importing...' : `Import ${label}`}
      </Button>
      {status[type] && (
        <div className={`text-sm ${status[type]?.success ? 'text-green-600' : 'text-red-600'}`}>
          {status[type]?.success
            ? `Imported ${status[type]?.imported} records`
            : status[type]?.error}
        </div>
      )}
    </div>
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
        <CardDescription>
          Import your data in the following order: Categories → Accounts → Payees → Transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImportButton type="categories" label="Categories" />
        <ImportButton type="accounts" label="Accounts" />
        <ImportButton type="payees" label="Payees" />
        <ImportButton type="transactions" label="Transactions" />
      </CardContent>
    </Card>
  )
}