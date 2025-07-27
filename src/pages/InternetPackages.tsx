import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Globe, Wifi, Shield, Users } from "lucide-react";

interface Package {
  name: string;
  duration: string;
  data: string;
  price: number;
}

const packages: Package[] = [
  { name: "Starter", duration: "1 Day", data: "5GB", price: 30 },
  { name: "Basic", duration: "3 Days", data: "12GB", price: 60 },
  { name: "Weekly", duration: "7 Days", data: "25GB", price: 99 },
  { name: "Bi-Weekly", duration: "14 Days", data: "45GB", price: 169 },
  { name: "Monthly", duration: "30 Days", data: "Unlimited", price: 299 },
  { name: "Extended", duration: "60 Days", data: "Unlimited", price: 550 },
];

const InternetPackages = () => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateCustomerId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  const openPackageDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setCustomerId(generateCustomerId());
    setIsDialogOpen(true);
  };

  const handleWhatsAppSupport = () => {
    const message = "Hello! I need help with my internet package purchase.";
    const whatsappUrl = `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async () => {
    if (!phone || phone.length < 8) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate payment processing
    try {
      // Here you would integrate with Flutterwave or M-Pesa
      // For demo purposes, we'll simulate a successful payment
      
      const transaction = {
        id: `TX_${Date.now()}`,
        customerId,
        phone: `+254${phone}`,
        package: selectedPackage?.name,
        duration: selectedPackage?.duration,
        data: selectedPackage?.data,
        amount: selectedPackage?.price,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };

      // Store transaction in localStorage (in real app, send to backend)
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      existingTransactions.push(transaction);
      localStorage.setItem('transactions', JSON.stringify(existingTransactions));

      toast({
        title: "Payment Successful! ✅",
        description: `Transaction ID: ${transaction.id}`,
      });

      setIsDialogOpen(false);
      setPhone("");
      setSelectedPackage(null);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
            <Globe className="h-8 w-8" />
            STARNET KENYA
          </div>
          <div className="bg-secondary p-3 rounded-lg">
            <p className="text-sm font-medium text-secondary-foreground">
              Affordable Internet Packages
            </p>
            <p className="text-xs italic text-muted-foreground">
              Available on all networks
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <Wifi className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Fast Speed</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">24/7 Support</span>
          </div>
        </div>

        {/* Packages */}
        <div className="space-y-3">
          {packages.map((pkg, index) => (
            <Button
              key={index}
              variant="package"
              size="lg"
              className="w-full justify-between text-left"
              onClick={() => openPackageDialog(pkg)}
            >
              <div>
                <div className="font-semibold">{pkg.duration} - {pkg.data}</div>
              </div>
              <div className="font-bold">Ksh {pkg.price}</div>
            </Button>
          ))}
        </div>

        {/* Support Section */}
        <div className="text-center space-y-3 pt-4 border-t">
          <p className="text-sm text-muted-foreground">Need help with your purchase?</p>
          <Button 
            variant="whatsapp" 
            size="lg" 
            className="w-full"
            onClick={handleWhatsAppSupport}
          >
            💬 WhatsApp Support
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Secure Payment Processing</p>
          <p className="text-success font-medium">✅ Till number copied to clipboard!</p>
        </div>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Enter Your Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerId">Customer ID</Label>
              <Input 
                id="customerId" 
                value={customerId} 
                readOnly 
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex">
                <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                  +254
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-l-none"
                />
              </div>
            </div>

            {selectedPackage && (
              <div className="bg-secondary p-3 rounded-lg text-center">
                <p className="font-semibold">{selectedPackage.duration} - {selectedPackage.data}</p>
                <p className="text-lg font-bold text-primary">Ksh {selectedPackage.price}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternetPackages;