export const LANGUAGE_VERSIONS: Record<string, string> = {
  javascript: "18.15.0",
  python: "3.11.2",
  java: "17.0.1",
  cpp: "10.2.0",
};

export const CODE_SNIPPETS: Record<string, string> = {
  javascript: `// Read input with readLine() if the platform provides it, or adapt
function solve() {
  // Example echo implementation
  return 'Hello AlgoBucks';
}

console.log(solve());
`,

  python: `# Example echo implementation
def solve():
    return 'Hello AlgoBucks'

if __name__ == '__main__':
    print(solve())
`,

  java: `import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // String s = br.readLine(); // read one line if needed
        System.out.print(solve());
    }

    static String solve() {
        // Implement your solution
        return "Hello AlgoBucks";
    }
}
`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // string s; getline(cin, s); // read one line if needed
    cout << "Hello AlgoBucks" << "\n";
    return 0;
}
`,
};
