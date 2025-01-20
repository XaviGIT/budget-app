export interface CategoryImport {
  id: string;
  name: string;
  icon: string;
}

export interface AccountImport {
  id: string;
  name: string;
  balance: number;
  type: "CREDIT" | "DEBIT";
}

export interface PayeeImport {
  id: string;
  name: string;
  icon: string;
}

export interface TransactionImport {
  id: string;
  account: string;
  date: string;
  payee: string;
  category: string;
  memo?: string;
  outflow?: number;
  inflow?: number;
}
