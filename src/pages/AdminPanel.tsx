import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Users, TrendingUp, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  customerId: string;
  phone: string;
  package: string;
  duration: string;
  data: string;
  amount: number;
  timestamp: string;
  status: string;
}

const AdminPanel = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load transactions from localStorage
    const storedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    setTransactions(storedTransactions);
    setFilteredTransactions(storedTransactions);
  }, []);

  useEffect(() => {
    // Filter transactions based on search term
    const filtered = transactions.filter(transaction =>
      transaction.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.phone.includes(searchTerm) ||
      transaction.package?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, transactions]);

  const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalCustomers = new Set(transactions.map(t => t.phone)).size;
  const totalPackagesSold = transactions.length;

  const packageStats = transactions.reduce((acc, transaction) => {
    const packageName = transaction.package || 'Unknown';
    acc[packageName] = (acc[packageName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Customer ID', 'Phone', 'Package', 'Duration', 'Data', 'Amount', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.customerId,
        t.phone,
        t.package,
        t.duration,
        t.data,
        t.amount,
        new Date(t.timestamp).toLocaleDateString(),
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starnet_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Transactions exported to CSV file",
    });
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all transaction data? This action cannot be undone.')) {
      localStorage.removeItem('transactions');
      setTransactions([]);
      setFilteredTransactions([]);
      toast({
        title: "Data Cleared",
        description: "All transaction data has been removed",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">STARNET Admin Panel</h1>
            <p className="text-muted-foreground">Monitor and manage internet package sales</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={clearAllData} variant="destructive" className="gap-2">
              Clear Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Ksh {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {totalPackagesSold} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Unique phone numbers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Packages Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalPackagesSold}</div>
              <p className="text-xs text-muted-foreground">
                Total package activations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                Ksh {totalPackagesSold > 0 ? Math.round(totalRevenue / totalPackagesSold) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Per package sale
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Package Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Package Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(packageStats).map(([packageName, count]) => (
                <div key={packageName} className="text-center">
                  <Badge variant="secondary" className="mb-2">{packageName}</Badge>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-muted-foreground">sales</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.customerId}</TableCell>
                        <TableCell>{transaction.phone}</TableCell>
                        <TableCell>{transaction.package}</TableCell>
                        <TableCell>{transaction.duration}</TableCell>
                        <TableCell>{transaction.data}</TableCell>
                        <TableCell className="font-medium">Ksh {transaction.amount}</TableCell>
                        <TableCell>{new Date(transaction.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;