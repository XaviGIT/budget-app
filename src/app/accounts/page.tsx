import { AccountsList } from "@/components/accounts/accounts-list";

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading accounts...</div>}>
      <AccountsList />
    </Suspense>
  );
}
