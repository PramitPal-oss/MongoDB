### **Clone a GitHub Repository Using a Different Account (Without Affecting Global GitHub User)**

Follow these steps **to clone a repository using a different GitHub account without affecting your global GitHub user.**

---

### **🔹 Step 1: Navigate to the Desired Folder**

Open a terminal and go to the folder where you want to clone the repository:

```sh
cd /path/to/your/folder
```

---

### **🔹 Step 2: Clone the Repository Using a Different GitHub Account**

Since **your global GitHub account does not have access**, you need to use a **Personal Access Token (PAT)** for authentication.

#### **Generate a GitHub PAT (If Not Already Created)**

1. Go to **GitHub → Settings → Developer settings → Personal access tokens** ([link](https://github.com/settings/tokens))
2. Click **"Generate new token (classic)"**
3. Select scopes:
   - ✅ `repo` (for full repository access)
4. Click **"Generate token"**
5. **Copy and save the token** (it won’t be shown again).

#### **Clone the Repository Using the Token**

Run the following command, replacing `USERNAME`, `TOKEN`, and `REPO_URL`:

```sh
git clone https://USERNAME:TOKEN@github.com/ORG/REPO.git .
```

Example:

```sh
git clone https://new-user:ghp_YourPAT@github.com/org-name/my-repo.git .
```

---

### **🔹 Step 3: Set Git Config Locally for This Folder**

Inside the cloned repository, set the GitHub user **only for this folder**:

```sh
git config --local user.name "NewGitHubUsername"
git config --local user.email "new-email@example.com"
```

---

### **🔹 Step 4: Store Credentials Locally (Without Affecting Global GitHub User)**

To avoid being asked for credentials repeatedly, store them **only for this repo**:

```sh
git config --local credential.helper store
```

---

### **🔹 Step 5: Verify Everything**

1. **Check if the correct remote URL is set:**

   ```sh
   git remote -v
   ```

   ✅ It should show your new GitHub username in the URL.

2. **Ensure the global GitHub account remains unaffected:**

   ```sh
   git config --global --list
   ```

   ✅ This should still show your **primary GitHub account**.

3. **Verify the local GitHub account for this repo:**
   ```sh
   git config --local --list
   ```
   ✅ It should show the **new GitHub username and email** only for this repository.

---

### **✅ Done!**
