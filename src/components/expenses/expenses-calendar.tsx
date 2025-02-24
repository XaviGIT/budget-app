"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";

interface BudgetAssignment {
  id: string;
  month: string;
  amount: number;
  category: {
    id: string;
    name: string;
    budgetConfig: {
      type: "monthly" | "target";
      amount: number;
      targetDate?: string;
    };
  };
}

interface ExpensesCalendarProps {
  budgets: BudgetAssignment[];
}

const calculateMonthExpenses = (
  monthDate: Date,
  assignments: BudgetAssignment[]
) => {
  const monthStr = format(monthDate, "yyyy-MM");

  const monthAssignments = assignments.filter(
    (assignment) => assignment.month === monthStr
  );

  const monthlyExpenses = monthAssignments.filter(
    (assignment) => assignment.category.budgetConfig.type === "monthly"
  );

  const targetExpenses = monthAssignments.filter(
    (assignment) => assignment.category.budgetConfig.type === "target"
  );

  return {
    monthly: monthlyExpenses,
    target: targetExpenses,
    totalMonthly: monthlyExpenses.reduce(
      (sum, budget) => sum + budget.amount,
      0
    ),
    totalTarget: targetExpenses.reduce((sum, budget) => sum + budget.amount, 0),
    total: monthAssignments.reduce((sum, budget) => sum + budget.amount, 0),
  };
};

export function ExpensesCalendar({ budgets }: ExpensesCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const nextYear = () => {
    const next = new Date(currentYear);
    next.setFullYear(next.getFullYear() + 1);
    setCurrentYear(next);
  };

  const prevYear = () => {
    const prev = new Date(currentYear);
    prev.setFullYear(prev.getFullYear() - 1);
    setCurrentYear(prev);
  };

  // Get all months in the current year
  const yearStart = startOfYear(currentYear);
  const yearEnd = endOfYear(currentYear);
  const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const selectedMonthExpenses = selectedMonth
    ? calculateMonthExpenses(selectedMonth, budgets)
    : null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Yearly Expenses Overview</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={prevYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">
            {format(currentYear, "yyyy")}
          </span>
          <Button variant="ghost" size="icon" onClick={nextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {monthsInYear.map((month) => {
          const expenses = calculateMonthExpenses(month, budgets);
          return (
            <Card
              key={month.toString()}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                selectedMonth &&
                format(selectedMonth, "yyyy-MM") === format(month, "yyyy-MM")
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => setSelectedMonth(month)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-medium">{format(month, "MMMM")}</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Monthly:</span>
                      <span>{formatCurrency(expenses.totalMonthly)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">Target:</span>
                      <span>{formatCurrency(expenses.totalTarget)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Total:</span>
                      <span>{formatCurrency(expenses.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={!!selectedMonth}
        onOpenChange={(open) => !open && setSelectedMonth(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMonth && format(selectedMonth, "MMMM yyyy")} Details
            </DialogTitle>
          </DialogHeader>
          {selectedMonthExpenses && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-blue-600">Monthly Expenses</h3>
                {selectedMonthExpenses.monthly.map((budget) => (
                  <div
                    key={budget.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{budget.category.name}</p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(budget.amount)}
                    </p>
                  </div>
                ))}
              </div>

              {selectedMonthExpenses.target.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-purple-600">
                    Target Expenses
                  </h3>
                  {selectedMonthExpenses.target.map((budget) => (
                    <div
                      key={budget.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{budget.category.name}</p>
                        {budget.category.budgetConfig.targetDate && (
                          <p className="text-sm text-muted-foreground">
                            Target:{" "}
                            {new Date(
                              budget.category.budgetConfig.targetDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(budget.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Total Expenses</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      selectedMonthExpenses.totalMonthly +
                        selectedMonthExpenses.totalTarget
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
