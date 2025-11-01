# 🚀 Quick Start Guide - Judge0 Compiler Setup

## ⚡ 5-Minute Setup

Your code editor now uses **Judge0 online compiler** for C++, Java, and Python execution. Follow these steps to get started:

### Step 1: Get Your Free API Key (2 minutes)

1. Go to [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Click **"Subscribe to Test"**
3. Select the **FREE** plan (50 requests/day)
4. Copy your `X-RapidAPI-Key`

### Step 2: Configure Your Project (1 minute)

Create a file named `.env` in the `client` folder:

```env
# Judge0 Online Compiler (Required)
VITE_RAPIDAPI_KEY=paste_your_key_here

# Optional: Use your own Judge0 instance
# VITE_JUDGE0_API=http://localhost:2358
```

### Step 3: Restart Dev Server (1 minute)

```bash
cd client
npm run dev
```

### Step 4: Test It! (1 minute)

1. Open the code editor
2. Write a simple program:

**C++:**
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello Judge0!" << endl;
    return 0;
}
```

**Java:**
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Judge0!");
    }
}
```

**Python:**
```python
print("Hello Judge0!")
```

3. Click **Run**
4. See the output! ✅

---

## ✨ What's New?

### Stronger Compilation
- ✅ Professional-grade compiler (Judge0)
- ✅ Better error messages with helpful tips
- ✅ Compilation error detection
- ✅ Runtime error detection
- ✅ Time and memory tracking

### User-Friendly Errors

**Before:**
```
Error: Failed to compile
```

**After:**
```
🔨 Compilation Error:
main.cpp:5:1: error: expected ';' before '}' token

💡 Check for:
1. Syntax errors
2. Missing semicolons
3. Undefined variables
4. Wrong class/function names

📚 Need help? Check JUDGE0_SETUP.md for setup instructions.
```

### Smart Rate Limit Handling

If you hit the rate limit (50/day on free plan):
```
⏱️ Rate limit exceeded. You've used all your free Judge0 requests for today.

💡 Solutions:
1. Wait 24 hours for reset (free tier)
2. Upgrade RapidAPI plan
3. Self-host Judge0 (unlimited)
```

---

## 🆘 Troubleshooting

### "Authentication Failed"
❌ **Problem:** Missing or invalid API key

✅ **Solution:**
1. Check `.env` file exists in `client` folder
2. Verify `VITE_RAPIDAPI_KEY` is set correctly
3. No quotes needed around the key
4. Restart dev server after changing `.env`

### "Rate limit exceeded"
❌ **Problem:** Used all 50 free requests today

✅ **Solutions:**
1. **Wait:** Resets in 24 hours
2. **Upgrade:** Get more requests on RapidAPI
3. **Self-host:** Unlimited with Docker (see JUDGE0_SETUP.md)

### Code not running
❌ **Problem:** Compilation or runtime error

✅ **Check:**
1. Click "Show Details" button to see full error
2. Read the error message carefully
3. Common issues:
   - Missing semicolons (C++/Java)
   - Wrong class name (Java: must be `Main` or `Solution`)
   - Syntax errors
   - Logic errors

---

## 📊 Features

| Feature | Status | Description |
|---------|--------|-------------|
| **C++ Compiler** | ✅ | GCC 9.2.0 with full STL |
| **Java Compiler** | ✅ | OpenJDK 13.0.1 |
| **Python** | ✅ | Python 3.8.1 |
| **Syntax Errors** | ✅ | Clear error messages |
| **Runtime Errors** | ✅ | Stack traces and debugging |
| **Time Tracking** | ✅ | Execution time in ms |
| **Memory Tracking** | ✅ | Memory usage in KB |
| **Multiple Test Cases** | ✅ | Run all tests at once |
| **Custom Input** | ✅ | Test with your own input |

---

## 💰 Pricing (RapidAPI)

| Plan | Requests/Day | Price |
|------|--------------|-------|
| **Free** | 50 | $0 |
| **Basic** | 2,500 | $5/month |
| **Pro** | 10,000 | $15/month |
| **Ultra** | 50,000 | $50/month |

💡 **Tip:** Free plan is enough for testing and small projects!

---

## 🔥 Pro Tips

1. **Save API Calls:** Write code offline, test once online
2. **Use Test Cases:** Load problem test cases automatically
3. **Check Logs:** Click "Show Details" for full execution info
4. **Self-Host:** Unlimited requests with Docker (10-minute setup)

---

## 📚 Next Steps

- ✅ Complete setup above
- 📖 Read full documentation: [JUDGE0_SETUP.md](./JUDGE0_SETUP.md)
- 🏠 Self-host for production: See "Option 2" in JUDGE0_SETUP.md
- 💬 Need help? Check the troubleshooting section

---

**Happy Coding! 🎉**

Your code editor now has **professional-grade compilation** with better error messages, faster execution, and zero local setup required!
