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

  // Safaricom Daraja API integration
  const getAccessToken = async () => {
    const consumerKey = "nLuyXezRJgm3fpxYDCjQE1vxLo4cz4Y9tSV3tdZAhjRl7pGT";
    const consumerSecret = "7LrWGPDLkLg7FPcJHgq8OZjVEoE1AnuLEUzq6TTX6nBw3TxqNf9qz6dPnqm3udRa";
    
    const credentials = btoa(`${consumerKey}:${consumerSecret}`);
    
    try {
      const response = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        method: "GET",
        headers: {
          "Authorization": `Basic ${credentials}`,
        },
      });
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw error;
    }
  };

  const initiateMpesaPayment = async (accessToken: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 14);
    const shortCode = "174379"; // Test shortcode
    const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; // Test passkey
    const password = btoa(`${shortCode}${passkey}${timestamp}`);

    const paymentData = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: selectedPackage?.price,
      PartyA: `254${phone}`,
      PartyB: shortCode,
      PhoneNumber: `254${phone}`,
      CallBackURL: "https://mydomain.com/callback",
      AccountReference: customerId,
      TransactionDesc: `${selectedPackage?.duration} - ${selectedPackage?.data} Package`,
    };

    try {
      const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error initiating M-Pesa payment:", error);
      throw error;
    }
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

    try {
      // Get access token
      const accessToken = await getAccessToken();
      
      // Initiate M-Pesa payment
      const paymentResponse = await initiateMpesaPayment(accessToken);
      
      if (paymentResponse.ResponseCode === "0") {
        // Payment initiated successfully
        const transaction = {
          id: paymentResponse.CheckoutRequestID,
          customerId,
          phone: `+254${phone}`,
          package: selectedPackage?.name,
          duration: selectedPackage?.duration,
          data: selectedPackage?.data,
          amount: selectedPackage?.price,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };

        // Store transaction in localStorage
        const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        existingTransactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(existingTransactions));

        toast({
          title: "Payment Initiated! 📱",
          description: "Check your phone for M-Pesa prompt",
        });

        setIsDialogOpen(false);
        setPhone("");
        setSelectedPackage(null);
      } else {
        throw new Error(paymentResponse.errorMessage || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
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