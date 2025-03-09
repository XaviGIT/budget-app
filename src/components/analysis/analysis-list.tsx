"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export function AnalysisList() {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 is current month, -1 is previous month, etc.
  const { data: transactions } = useTransactions();

  // Helper function to get month name
  const getMonthName = (monthsAgo: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  };

  // Filter last 6 months of transactions
  const filteredTransactions =
    transactions?.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      return transactionDate >= sixMonthsAgo;
    }) || [];

  // Calculate spending by category
  const spendingByCategory = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.amount < 0 && transaction.category) {
        // Only count expenses (not transfers or income)
        const categoryName = transaction.category.name;
        acc[categoryName] =
          (acc[categoryName] || 0) + Math.abs(transaction.amount);
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const pieChartData = Object.entries(spendingByCategory).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  // Calculate monthly totals
  const monthlyData = filteredTransactions.reduce(
    (acc, transaction) => {
      const date = new Date(transaction.date);
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!acc[monthYear]) {
        acc[monthYear] = { expenses: 0, income: 0 };
      }
      if (transaction.amount < 0) {
        acc[monthYear].expenses += Math.abs(transaction.amount);
      } else {
        acc[monthYear].income += transaction.amount;
      }
      return acc;
    },
    {} as Record<string, { expenses: number; income: number }>
  );

  const lineChartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    expenses: data.expenses,
    income: data.income,
  }));

  const handlePrevMonth = () => setCurrentMonth((prev) => prev + 1);
  const handleNextMonth = () =>
    setCurrentMonth((prev) => Math.max(prev - 1, 0));

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analysis</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">
            Last 6 months to {getMonthName(currentMonth)}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) =>
                      `${name}: ${formatCurrency(value)}`
                    }
                  >
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#82ca9d"
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ff7c43"
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
