# Judge0 Online Compiler Integration Setup

This project now uses **Judge0** (an online code execution system similar to OnlineGDB) to compile and run C++, Java, and Python code. The UI remains the same, but code execution happens on Judge0's backend.

## What is Judge0?

Judge0 is an open-source online code execution system that provides a robust API for compiling and executing code in multiple programming languages. It's similar to OnlineGDB but provides better API access.

## Setup Options

### Option 1: Use Judge0 via RapidAPI (Easiest - Free Tier Available)

1. **Sign up for RapidAPI**:
   - Go to https://rapidapi.com/
   - Create a free account

2. **Subscribe to Judge0 CE**:
   - Visit https://rapidapi.com/judge0-official/api/judge0-ce
   - Click "Subscribe to Test" and select the **FREE** plan
   - The free tier includes: 50 requests/day

3. **Get your API Key**:
   - After subscribing, you'll see your `X-RapidAPI-Key` in the code snippets section
   - Copy this key

4. **Configure your project**:
   - Create or update `client/.env` file:
   ```env
   VITE_RAPIDAPI_KEY=your_rapidapi_key_here
   ```

5. **Restart your development server**:
   ```bash
   cd client
   npm run dev
   ```

### Option 2: Self-Host Judge0 (For Production - Unlimited)

For production use or to avoid API rate limits, you can host your own Judge0 instance:

1. **Install Judge0 using Docker**:
   ```bash
   git clone https://github.com/judge0/judge0.git
   cd judge0
   docker-compose up -d
   ```

2. **Configure your project**:
   - Update `client/.env`:
   ```env
   VITE_JUDGE0_API=http://localhost:2358
   ```

3. **Documentation**: https://github.com/judge0/judge0/blob/master/CHANGELOG.md

## Supported Languages

The integration currently supports:

| Language   | Judge0 Language ID | Version           |
|------------|-------------------|-------------------|
| C++        | 54                | GCC 9.2.0         |
| Java       | 62                | OpenJDK 13.0.1    |
| Python     | 71                | Python 3.8.1      |
| JavaScript | 63                | Node.js 12.14.0   |

## Features

✅ **Same UI** - Your existing code editor interface remains unchanged
✅ **Online Execution** - All code runs on Judge0's backend (or your self-hosted instance)
✅ **Run Code** - Test with single test case
✅ **Run All** - Batch execution of multiple test cases
✅ **Submit** - Submit solutions with all test cases
✅ **Error Handling** - Proper compilation error and runtime error reporting
✅ **Time Limits** - Configurable time limit exceeded detection
✅ **Memory Tracking** - Memory usage reporting for each execution

## Rate Limits (RapidAPI Free Tier)

- **50 requests/day** on the free plan
- Each "Run" or "Submit" counts as 1 or more requests (depending on test cases)
- For higher limits, upgrade to a paid RapidAPI plan or self-host Judge0

## Troubleshooting

### "Judge0 API Error (401)"
- Check that your `VITE_RAPIDAPI_KEY` is set correctly in `.env`
- Verify you're subscribed to Judge0 CE on RapidAPI
- Restart your development server after changing `.env`

### "Judge0 API Error (429)"
- You've exceeded the rate limit
- Wait 24 hours or upgrade to a paid plan
- Consider self-hosting Judge0 for unlimited requests

### "Judge0 API unavailable"
- Check your internet connection
- Verify Judge0 service is up: https://rapidapi.com/judge0-official/api/judge0-ce
- If self-hosting, ensure Docker containers are running

## Migration from Local Compiler

The old local compiler code has been replaced with Judge0 integration. If you need to revert:
1. Check git history for the previous implementation
2. Or set up your own execution backend

## Benefits of Judge0

1. **No Local Setup**: No need to install compilers (GCC, JDK, Python) locally
2. **Consistent Environment**: All users get the same compiler versions
3. **Security**: Code runs in isolated sandboxes
4. **Scalability**: Can handle many concurrent users
5. **Professional**: Used by many coding platforms and educational institutions

## Next Steps

1. Set up your API key using Option 1 above
2. Test the integration with a simple program
3. Monitor your API usage on RapidAPI dashboard
4. Consider self-hosting for production if needed

## Support

- Judge0 Documentation: https://ce.judge0.com/
- RapidAPI Judge0 CE: https://rapidapi.com/judge0-official/api/judge0-ce
- Judge0 GitHub: https://github.com/judge0/judge0

---

**Note**: The UI and user experience remain identical to before. Users won't notice any difference except faster and more reliable code execution! 🚀
