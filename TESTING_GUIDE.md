# Testing Instructions for Live Auctions

## How to Test the Dual Role Functionality

### 1. Clear Previous Data (Optional)
If you want to start fresh, open the browser console (F12) and run:
```javascript
localStorage.clear();
location.reload();
```

### 2. Login and Navigate
1. **Login** to the platform with any phone number
2. **Go to Dashboard** → **My Auctions**

### 3. Test as Auctioneer
1. **Click "My Created Auctions" tab**
2. You should see **4 live auctions** created by you:
   - **AUC001** - Steel Pipes and Fittings (LIVE) 
   - **AUC002** - Medical Equipment (LIVE)
   - **AUC003** - Vehicle Fleet (LIVE) 
   - **AUC004** - Office Equipment (Upcoming)
   - **AUC005** - IT Hardware (Tomorrow)

3. **Click "Join as Auctioneer"** on any live auction
4. You'll see the **Auctioneer Live View** with:
   - Real-time countdown timer
   - Live participant rankings (L1, L2, L3...)
   - Company names and addresses
   - Offered prices (lowest to highest)
   - Auto-extension notifications

### 4. Test as Participant  
1. **Click "My Participated Auctions" tab**
2. You should see **4 live auctions** you can participate in:
   - **AUC006** - Textile Machinery (LIVE - by XYZ Steel Suppliers)
   - **AUC007** - Food Processing Equipment (LIVE - by Prime Metal Works)
   - **AUC008** - Laboratory Equipment (LIVE - by XYZ Steel Suppliers)
   - **AUC009** - Construction Equipment (Starting soon - by Prime Metal Works)

3. **Click "Join as Participant"** on any live auction
4. You'll see the **Participant Auction Session** with:
   - Auctioneer company details
   - Complete auction information
   - Live countdown timer
   - Bid submission form
   - Live rankings showing L1 (current lowest)
   - Your position in rankings

### 5. Test Live Bidding
1. In **Participant view**, enter a bid amount
2. **Submit the bid** and see:
   - Real-time updates
   - Auto-extension if bid placed in last 3 minutes
   - Updated rankings
   - Success notifications

### 6. Test Real-time Features
- **Countdown timers** update every second
- **Participant rankings** refresh every few seconds
- **Auto-extension** when bids placed in last 3 minutes
- **Status transitions** from upcoming → live → completed

## Sample Data Available

### Your Created Auctions (Auctioneer Role):
- **3 LIVE auctions** ready for monitoring
- **2 Upcoming auctions** for future testing
- All with different decremental values and price ranges

### Auctions You Can Join (Participant Role):
- **3 LIVE auctions** ready for bidding
- **1 About to start** (30 seconds)
- Different auctioneers and industries

## Key Features to Test

1. **Smart Button Logic**: Different buttons for auctioneer vs participant
2. **Real-time Updates**: Live countdown and bidding data
3. **Auto-extension**: Auction extends by 3 minutes when needed
4. **Dual Interfaces**: Complete different views for each role
5. **Validation**: Proper bid validation and error handling
6. **Rankings**: Live L1, L2, L3 positioning

## Troubleshooting

If you don't see the expected auctions:
1. **Refresh the page** - data loads on page refresh
2. **Clear localStorage** and reload to get fresh sample data
3. **Check browser console** for any errors

The platform now has comprehensive test data for both auctioneer and participant roles!
