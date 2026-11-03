# Electronic Corner website

The online store for [@electroniccorner](https://instagram.com/electroniccorner).
The website is hosted on **Render** (free), and orders, products and supplier costs are saved in **Google Firebase** (free).

- Store: `https://YOUR-SITE.onrender.com`
- Admin panel: `https://YOUR-SITE.onrender.com/#admin` → code **8259**, then sign in once per device with your Firebase email and password.

Never upload `PRIVATE-supplier-costs.json` here. Everything in this repository can be seen by anyone who visits the website.

---

## One-time setup

### 1. Firebase (where orders are saved)
1. Go to <https://console.firebase.google.com>, sign in with your Google account and click **Create a project**. Name it `electroniccorner`. You can turn off Google Analytics.
2. Open **Authentication** (find it in the left menu or the search bar at the top, or change the end of the address from `/overview` to `/authentication`) → **Get started → Sign-in method → Email/Password → Enable → Save.**
3. **Authentication → Users → Add user.** Enter your email and a strong password. This is your admin login.
4. Open **Firestore Database** (left menu, search bar, or change the end of the address to `/firestore`) → **Create database.** Choose location **asia-south1 (Mumbai)** and **Start in production mode**.
5. Open the **Rules** tab, delete everything, paste the rules below, change `YOUR_EMAIL_HERE` to the email from step 3 (in small letters, keep the quote marks), and click **Publish**.
6. Click the gear icon → **Project settings** → **Your apps** → the **`</>`** (Web) button. Name it `store` and click **Register app**. Firebase then shows a block of code starting with `const firebaseConfig = {`. Keep that page open.

### 2. GitHub (holds the website files)
1. Sign up at <https://github.com> (free). Click **New repository**, name it `electroniccorner`, and click **Create repository**.
2. Click **uploading an existing file**, drag in all the website files, and click **Commit changes**.
3. Open **firebase-config.txt**, click the pencil icon, replace the example with the `firebaseConfig` block from Firebase step 6, and click **Commit changes**.

### 3. Render (puts the website online)
1. Sign up at <https://render.com> using **GitHub**.
2. Click **New → Static Site**, connect your GitHub account and pick the `electroniccorner` repository.
3. Leave **Build Command** empty. Set **Publish Directory** to `./`. Click **Create Static Site**.
4. After about a minute, your site is live at `https://….onrender.com`.

### 4. First time in the admin panel
1. Open `your-site/#admin`, enter **8259**, then sign in with your Firebase email and password.
2. Click **Add the 5 starter products**.
3. Click **Choose supplier-cost file** and pick `PRIVATE-supplier-costs.json`. This file stays on your computer.
4. Put the website link in your Instagram bio.

---

## Firestore rules (paste in Firebase → Firestore Database → Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isOwner() {
      return request.auth != null
        && request.auth.token.email.lower() == 'YOUR_EMAIL_HERE';
    }
    function str(v, n) { return v is string && v.size() <= n; }
    function validOrder(d) {
      return d.keys().hasOnly(['code', 'createdAt', 'customer', 'items', 'total', 'status', 'tracking'])
        && d.status == 'new' && d.tracking == ''
        && d.createdAt == request.time
        && str(d.code, 20)
        && d.items is list && d.items.size() > 0 && d.items.size() <= 20
        && d.total is number && d.total > 0 && d.total < 500000
        && d.customer is map
        && d.customer.keys().hasOnly(['name', 'phone', 'email', 'instagram', 'address', 'city', 'state', 'zip', 'country'])
        && str(d.customer.name, 100) && d.customer.name.size() > 0
        && str(d.customer.phone, 20) && str(d.customer.address, 300)
        && str(d.customer.city, 80) && str(d.customer.state, 80) && str(d.customer.zip, 10);
    }

    match /products/{id} { allow read: if true; allow write: if isOwner(); }
    match /photos/{id}   { allow read: if true; allow write: if isOwner(); }
    match /supplier/{id} { allow read, write: if isOwner(); }
    match /orders/{id} {
      allow get: if true;                      // a customer can look up their own order by its private ID
      allow list, update, delete: if isOwner();
      allow create: if validOrder(request.resource.data);
    }
  }
}
```

---

## Everyday use
- **New orders** appear in the admin panel under **Orders**. Contact the customer on the mobile number they gave to confirm and share payment details, then click **Mark paid**. Order from the supplier using the link shown, and when it ships, click **Mark shipped** and add the tracking number.
- **Prices, stock and photos:** change them in the admin panel. The website updates immediately; you don't need GitHub or Render for that.
- **Help:** customers use the "DM @electroniccorner" links on the site.
- **Before checking out, a customer's prices come from the website.** If an order shows "listing is ₹…", the price in the order is different from your current price, so check it before confirming.
- **Try without Firebase:** open `your-site/?demo#admin` to try everything with test data saved only in your browser.
