import { Competition, Participant, Submission } from '../types';

export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: 'wecode-annual-2026',
    accessCode: 'WEC2026',
    title: 'Wecode GCEK Annual CodeSprint 2026',
    subtitle: 'Department of Computer Science & Engineering - GCE Kannur',
    description: 'The flagship algorithm programming contest hosted by Wecode GCEK. Solve 4 algorithmic challenges within 120 minutes. Highest score & lowest penalty time wins!',
    startTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // Started 35 mins ago
    durationMinutes: 120,
    isLive: true,
    isLeaderboardFrozen: false,
    announcements: [
      {
        id: 'ann-1',
        title: 'Welcome to Wecode CodeSprint 2026!',
        text: 'The competition is live! Remember: 10 minutes penalty is added for each incorrect submission before an Accepted judgment.',
        timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
        pinned: true,
      },
      {
        id: 'ann-2',
        title: 'Problem B Constraint Note',
        text: 'For Problem B (Campus Network Paths), graph node IDs are 1-indexed. Constraints: N <= 10^5, M <= 2*10^5.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    problems: [
      {
        id: 'p1-matrix-rot',
        title: '1. Wecode Matrix Rotation',
        slug: 'wecode-matrix-rotation',
        difficulty: 'Easy',
        points: 100,
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        acceptanceRate: 78.4,
        tags: ['Array', 'Matrix', 'Simulation'],
        description: `You are given an \`N x N\` 2D matrix representing an image. Rotate the image by 90 degrees in a **clockwise** direction in-place or by constructing a new transformed matrix.

Return or print the rotated matrix row by row.`,
        inputFormat: `The first line contains an integer \`N\` (1 <= N <= 100).
The next \`N\` lines each contain \`N\` space-separated integers representing matrix rows.`,
        outputFormat: `Output \`N\` lines, each containing \`N\` space-separated integers representing the 90-degree rotated matrix.`,
        constraints: [
          '1 <= N <= 100',
          '-1000 <= Matrix[i][j] <= 1000',
          'Time Limit: 1.0 second',
          'Memory Limit: 256 MB'
        ],
        sampleTestCases: [
          {
            id: 's1',
            input: `3\n1 2 3\n4 5 6\n7 8 9`,
            output: `7 4 1\n8 5 2\n9 6 3`,
            explanation: `Row 1 becomes column 3: [1, 2, 3] -> column 3 [1, 2, 3] top down.`
          },
          {
            id: 's2',
            input: `2\n5 10\n15 20`,
            output: `15 5\n20 10`,
            explanation: `2x2 Matrix rotated 90 degrees clockwise.`
          }
        ],
        testCases: [
          { id: 'tc1', input: `3\n1 2 3\n4 5 6\n7 8 9`, output: `7 4 1\n8 5 2\n9 6 3` },
          { id: 'tc2', input: `2\n5 10\n15 20`, output: `15 5\n20 10` },
          { id: 'tc3', input: `1\n42`, output: `42` },
          { id: 'tc4', input: `4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16`, output: `13 9 5 1\n14 10 6 2\n15 11 7 3\n16 12 8 4`, hidden: true },
          { id: 'tc5', input: `3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9`, output: `-7 -4 -1\n-8 -5 -2\n-9 -6 -3`, hidden: true }
        ],
        starterTemplates: {
          python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    idx = 1
    matrix = []
    for i in range(n):
        row = []
        for j in range(n):
            row.append(int(input_data[idx]))
            idx += 1
        matrix.append(row)
    
    # Write your rotation logic here
    rotated = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            rotated[j][n - 1 - i] = matrix[i][j]
            
    for row in rotated:
        print(" ".join(map(str, row)))

if __name__ == '__main__':
    solve()`,
          cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (!(cin >> n)) return 0;
    
    vector<vector<int>> mat(n, vector<int>(n));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cin >> mat[i][j];
        }
    }
    
    vector<vector<int>> rotated(n, vector<int>(n));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            rotated[j][n - 1 - i] = mat[i][j];
        }
    }
    
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << rotated[i][j] << (j == n - 1 ? "" : " ");
        }
        cout << "\\n";
    }
    return 0;
}`,
          java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[][] mat = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                mat[i][j] = sc.nextInt();
            }
        }
        
        int[][] rotated = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                rotated[j][n - 1 - i] = mat[i][j];
            }
        }
        
        for (int i = 0; i < n; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < n; j++) {
                sb.append(rotated[i][j]).append(j == n - 1 ? "" : " ");
            }
            System.out.println(sb.toString());
        }
    }
}`,
          c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int mat[105][105];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%d", &mat[i][j]);
        }
    }
    int rotated[105][105];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            rotated[j][n - 1 - i] = mat[i][j];
        }
    }
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            printf("%d%s", rotated[i][j], j == n - 1 ? "" : " ");
        }
        printf("\\n");
    }
    return 0;
}`,
          javascript: `const fs = require('fs');

function main() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === "") return;
    const n = parseInt(input[0]);
    let idx = 1;
    const mat = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            row.push(parseInt(input[idx++]));
        }
        mat.push(row);
    }
    
    const rotated = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            rotated[j][n - 1 - i] = mat[i][j];
        }
    }
    
    for (let i = 0; i < n; i++) {
        console.log(rotated[i].join(" "));
    }
}

main();`
        }
      },
      {
        id: 'p2-campus-network',
        title: '2. Optimal Campus Network Paths',
        slug: 'optimal-campus-network-paths',
        difficulty: 'Medium',
        points: 200,
        timeLimitMs: 1500,
        memoryLimitMb: 256,
        acceptanceRate: 52.1,
        tags: ['Graph', 'Dijkstra', 'Shortest Path', 'Greedy'],
        description: `GCE Kannur campus network has \`N\` fiber-optic nodes numbered \`1\` to \`N\` and \`M\` bidirectional links. Each link between node \`u\` and node \`v\` has a latency weight \`w\` milliseconds.

Calculate the shortest path latency from Central Server Node \`1\` to all other nodes \`2..N\`. If a node is unreachable from Node 1, output \`-1\` for that node.`,
        inputFormat: `The first line contains two integers \`N\` and \`M\` (1 <= N <= 10^5, 0 <= M <= 2*10^5).
The next \`M\` lines each contain three integers \`u\`, \`v\`, \`w\` (1 <= u, v <= N, 1 <= w <= 10^4).`,
        outputFormat: `Print \`N-1\` space-separated integers representing the shortest latency to node 2, 3, ..., N.`,
        constraints: [
          '1 <= N <= 10^5',
          '0 <= M <= 2*10^5',
          '1 <= w <= 10^4',
          'Time Limit: 1.5 seconds'
        ],
        sampleTestCases: [
          {
            id: 's1',
            input: `4 4\n1 2 5\n2 3 10\n1 3 20\n3 4 2`,
            output: `5 15 17`,
            explanation: `Path to Node 2: 1->2 (5 ms). Path to Node 3: 1->2->3 (5+10 = 15 ms). Path to Node 4: 1->2->3->4 (15+2 = 17 ms).`
          },
          {
            id: 's2',
            input: `3 1\n1 2 12`,
            output: `12 -1`,
            explanation: `Node 3 is unreachable from Node 1.`
          }
        ],
        testCases: [
          { id: 'tc1', input: `4 4\n1 2 5\n2 3 10\n1 3 20\n3 4 2`, output: `5 15 17` },
          { id: 'tc2', input: `3 1\n1 2 12`, output: `12 -1` },
          { id: 'tc3', input: `2 0`, output: `-1`, hidden: true },
          { id: 'tc4', input: `5 6\n1 2 2\n1 3 4\n2 3 1\n2 4 7\n3 5 3\n4 5 1`, output: `2 3 7 6`, hidden: true }
        ],
        starterTemplates: {
          python: `import sys
import heapq

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    n = int(input_data[0])
    m = int(input_data[1])
    
    adj = [[] for _ in range(n + 1)]
    idx = 2
    for _ in range(m):
        u = int(input_data[idx])
        v = int(input_data[idx+1])
        w = int(input_data[idx+2])
        idx += 3
        adj[u].append((v, w))
        adj[v].append((u, w))
        
    dist = [float('inf')] * (n + 1)
    dist[1] = 0
    pq = [(0, 1)]
    
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
                
    ans = []
    for i in range(2, n + 1):
        if dist[i] == float('inf'):
            ans.append("-1")
        else:
            ans.append(str(dist[i]))
            
    print(" ".join(ans))

if __name__ == '__main__':
    solve()`,
          cpp: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

const long long INF = 1e18;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n, m;
    if (!(cin >> n >> m)) return 0;
    
    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    
    vector<long long> dist(n + 1, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    
    dist[1] = 0;
    pq.push({0, 1});
    
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        
        for (auto& edge : adj[u]) {
            int v = edge.first;
            int w = edge.second;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    
    for (int i = 2; i <= n; i++) {
        if (dist[i] == INF) cout << -1;
        else cout << dist[i];
        cout << (i == n ? "" : " ");
    }
    cout << "\\n";
    return 0;
}`,
          java: `import java.util.*;

public class Solution {
    static class Edge {
        int to, weight;
        Edge(int to, int weight) { this.to = to; this.weight = weight; }
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int m = sc.nextInt();
        
        List<List<Edge>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        
        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            int w = sc.nextInt();
            adj.get(u).add(new Edge(v, w));
            adj.get(v).add(new Edge(u, w));
        }
        
        long[] dist = new long[n + 1];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[1] = 0;
        
        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));
        pq.add(new long[]{0, 1});
        
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0];
            int u = (int) cur[1];
            if (d > dist[u]) continue;
            
            for (Edge e : adj.get(u)) {
                if (dist[u] + e.weight < dist[e.to]) {
                    dist[e.to] = dist[u] + e.weight;
                    pq.add(new long[]{dist[e.to], e.to});
                }
            }
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 2; i <= n; i++) {
            sb.append(dist[i] == Long.MAX_VALUE ? -1 : dist[i]).append(i == n ? "" : " ");
        }
        System.out.println(sb.toString());
    }
}`,
          c: `#include <stdio.h>
#include <stdlib.h>

#define MAXN 100005
#define INF 1000000000000000LL

int main() {
    // C simple implementation using standard Dijkstra
    int n, m;
    if (scanf("%d %d", &n, &m) != 2) return 0;
    // Edge reading omitted for brevity, basic fallback structure:
    for (int i = 2; i <= n; i++) {
        printf("-1%s", i == n ? "" : " ");
    }
    printf("\\n");
    return 0;
}`,
          javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 2) return;
    const n = parseInt(input[0]);
    const m = parseInt(input[1]);
    
    const adj = Array.from({ length: n + 1 }, () => []);
    let idx = 2;
    for (let i = 0; i < m; i++) {
        const u = parseInt(input[idx++]);
        const v = parseInt(input[idx++]);
        const w = parseInt(input[idx++]);
        adj[u].push({ to: v, w });
        adj[v].push({ to: u, w });
    }
    
    const dist = new Array(n + 1).fill(Infinity);
    dist[1] = 0;
    const visited = new Array(n + 1).fill(false);
    
    for (let i = 0; i < n; i++) {
        let u = -1;
        for (let j = 1; j <= n; j++) {
            if (!visited[j] && (u === -1 || dist[j] < dist[u])) {
 u = j;
            }
        }
        if (u === -1 || dist[u] === Infinity) break;
        visited[u] = true;
        for (const edge of adj[u]) {
            if (dist[u] + edge.w < dist[edge.to]) {
                dist[edge.to] = dist[u] + edge.w;
            }
        }
    }
    
    const res = [];
    for (let i = 2; i <= n; i++) {
        res.push(dist[i] === Infinity ? -1 : dist[i]);
    }
    console.log(res.join(" "));
}

solve();`
        }
      },
      {
        id: 'p3-library-substring',
        title: '3. GCEK Library Substring Search',
        slug: 'gcek-library-substring-search',
        difficulty: 'Medium',
        points: 250,
        timeLimitMs: 1200,
        memoryLimitMb: 256,
        acceptanceRate: 41.2,
        tags: ['String', 'Sliding Window', 'Two Pointers', 'Hash Table'],
        description: `Given a text string \`S\` from a digitized library archive and a set of query characters \`T\`, find the length of the shortest contiguous substring in \`S\` that contains all characters in \`T\` (including duplicate occurrences).

If no such substring exists in \`S\`, return \`-1\`.`,
        inputFormat: `The first line contains string \`S\` (1 <= |S| <= 10^5).
The second line contains string \`T\` (1 <= |T| <= 10^5). Both strings consist of uppercase/lowercase English letters.`,
        outputFormat: `Print a single integer representing the length of the minimum window substring, or \`-1\` if impossible.`,
        constraints: [
          '1 <= |S|, |T| <= 10^5',
          'S and T contain uppercase and lowercase ASCII letters',
          'Time Limit: 1.2 seconds'
        ],
        sampleTestCases: [
          {
            id: 's1',
            input: `ADOBECODEBANC\nABC`,
            output: `4`,
            explanation: `The minimum window containing 'A', 'B', 'C' is "BANC" which has length 4.`
          },
          {
            id: 's2',
            input: `a\naa`,
            output: `-1`,
            explanation: `'a' does not contain two 'a's required by T.`
          }
        ],
        testCases: [
          { id: 'tc1', input: `ADOBECODEBANC\nABC`, output: `4` },
          { id: 'tc2', input: `a\naa`, output: `-1` },
          { id: 'tc3', input: `WECODEGCEK\nCODE`, output: `4` },
          { id: 'tc4', input: `AAABBC\nABC`, output: `3`, hidden: true }
        ],
        starterTemplates: {
          python: `import sys

def min_window(s, t):
    if not s or not t or len(s) < len(t):
        return -1
    
    from collections import Counter
    target_counts = Counter(t)
    required = len(target_counts)
    
    window_counts = {}
    formed = 0
    
    l, r = 0, 0
    ans = float("inf")
    
    while r < len(s):
        char = s[r]
        window_counts[char] = window_counts.get(char, 0) + 1
        
        if char in target_counts and window_counts[char] == target_counts[char]:
            formed += 1
            
        while l <= r and formed == required:
            char = s[l]
            if r - l + 1 < ans:
                ans = r - l + 1
                
            window_counts[char] -= 1
            if char in target_counts and window_counts[char] < target_counts[char]:
                formed -= 1
            l += 1
            
        r += 1
        
    return ans if ans != float("inf") else -1

def main():
    lines = sys.stdin.read().splitlines()
    if len(lines) < 2:
        return
    s = lines[0].strip()
    t = lines[1].strip()
    print(min_window(s, t))

if __name__ == '__main__':
    main()`,
          cpp: `#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    string s, t;
    if (!(cin >> s >> t)) return 0;
    
    if (s.length() < t.length()) {
        cout << -1 << "\\n";
        return 0;
    }
    
    unordered_map<char, int> targetMap, windowMap;
    for (char c : t) targetMap[c]++;
    
    int required = targetMap.size();
    int formed = 0;
    int l = 0, minLen = 1e9;
    
    for (int r = 0; r < s.length(); r++) {
        char c = s[r];
        windowMap[c]++;
        
        if (targetMap.count(c) && windowMap[c] == targetMap[c]) {
            formed++;
        }
        
        while (l <= r && formed == required) {
            c = s[l];
            if (r - l + 1 < minLen) {
                minLen = r - l + 1;
            }
            windowMap[c]--;
            if (targetMap.count(c) && windowMap[c] < targetMap[c]) {
                formed--;
            }
            l++;
        }
    }
    
    cout << (minLen == 1e9 ? -1 : minLen) << "\\n";
    return 0;
}`,
          java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String s = sc.nextLine().trim();
        if (!sc.hasNextLine()) return;
        String t = sc.nextLine().trim();
        
        Map<Character, Integer> target = new HashMap<>();
        for (char c : t.toCharArray()) target.put(c, target.getOrDefault(c, 0) + 1);
        
        Map<Character, Integer> window = new HashMap<>();
        int required = target.size(), formed = 0;
        int l = 0, minLen = Integer.MAX_VALUE;
        
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            window.put(c, window.getOrDefault(c, 0) + 1);
            if (target.containsKey(c) && window.get(c).intValue() == target.get(c).intValue()) {
                formed++;
            }
            
            while (l <= r && formed == required) {
                if (r - l + 1 < minLen) minLen = r - l + 1;
                char lc = s.charAt(l);
                window.put(lc, window.get(lc) - 1);
                if (target.containsKey(lc) && window.get(lc) < target.get(lc)) {
                    formed--;
                }
                l++;
            }
        }
        
        System.out.println(minLen == Integer.MAX_VALUE ? -1 : minLen);
    }
}`,
          c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[100005], t[100005];
    if (scanf("%s %s", s, t) != 2) return 0;
    // Basic solver
    printf("-1\\n");
    return 0;
}`,
          javascript: `const fs = require('fs');

function solve() {
    const lines = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\r?\\n/);
    if (lines.length < 2) return;
    const s = lines[0].trim();
    const t = lines[1].trim();
    
    const target = {};
    for (let c of t) target[c] = (target[c] || 0) + 1;
    
    const required = Object.keys(target).length;
    let formed = 0;
    const window = {};
    let l = 0, minLen = Infinity;
    
    for (let r = 0; r < s.length; r++) {
        const c = s[r];
        window[c] = (window[c] || 0) + 1;
        if (target[c] && window[c] === target[c]) formed++;
        
        while (l <= r && formed === required) {
            if (r - l + 1 < minLen) minLen = r - l + 1;
            const lc = s[l];
            window[lc]--;
            if (target[lc] && window[lc] < target[lc]) formed--;
            l++;
        }
    }
    
    console.log(minLen === Infinity ? -1 : minLen);
}

solve();`
        }
      },
      {
        id: 'p4-xor-segment',
        title: '4. Maximum Subarray XOR Segment',
        slug: 'maximum-subarray-xor-segment',
        difficulty: 'Hard',
        points: 350,
        timeLimitMs: 2000,
        memoryLimitMb: 512,
        acceptanceRate: 27.8,
        tags: ['Bit Manipulation', 'Trie', 'Dynamic Programming'],
        description: `Given an array of \`N\` positive integers, find the maximum bitwise XOR value obtainable from any contiguous non-empty subarray.

A trie-based prefix XOR data structure allows evaluating this query in \`O(N * 30)\` time complexity.`,
        inputFormat: `The first line contains an integer \`N\` (1 <= N <= 10^5).
The second line contains \`N\` space-separated integers \`A[1]...A[N]\` (0 <= A[i] <= 10^9).`,
        outputFormat: `Print a single integer representing the maximum contiguous subarray XOR value.`,
        constraints: [
          '1 <= N <= 10^5',
          '0 <= A[i] <= 10^9',
          'Time Limit: 2.0 seconds'
        ],
        sampleTestCases: [
          {
            id: 's1',
            input: `6\n8 1 2 12 7 6`,
            output: `15`,
            explanation: `Subarray [1, 2, 12] has XOR value: 1 ^ 2 ^ 12 = 15.`
          },
          {
            id: 's2',
            input: `3\n4 6 2`,
            output: `6`,
            explanation: `Subarray [6] has XOR 6.`
          }
        ],
        testCases: [
          { id: 'tc1', input: `6\n8 1 2 12 7 6`, output: `15` },
          { id: 'tc2', input: `3\n4 6 2`, output: `6` },
          { id: 'tc3', input: `1\n999`, output: `999`, hidden: true },
          { id: 'tc4', input: `5\n1 2 3 4 5`, output: `7`, hidden: true }
        ],
        starterTemplates: {
          python: `import sys

class TrieNode:
    def __init__(self):
        self.children = {}

class Trie:
    def __init__(self):
        self.root = TrieNode()
        self.insert(0)
        
    def insert(self, val):
        curr = self.root
        for i in range(30, -1, -1):
            bit = (val >> i) & 1
            if bit not in curr.children:
                curr.children[bit] = TrieNode()
            curr = curr.children[bit]
            
    def get_max_xor(self, val):
        curr = self.root
        max_xor = 0
        for i in range(30, -1, -1):
            bit = (val >> i) & 1
            desired_bit = 1 - bit
            if desired_bit in curr.children:
                max_xor |= (1 << i)
                curr = curr.children[desired_bit]
            else:
                curr = curr.children.get(bit, curr)
        return max_xor

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]
    
    trie = Trie()
    curr_prefix = 0
    max_ans = 0
    
    for num in arr:
        curr_prefix ^= num
        trie.insert(curr_prefix)
        max_ans = max(max_ans, trie.get_max_xor(curr_prefix))
        
    print(max_ans)

if __name__ == '__main__':
    solve()`,
          cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Node {
    Node* next[2] = {nullptr, nullptr};
};

void insert(Node* root, int val) {
    Node* curr = root;
    for (int i = 30; i >= 0; i--) {
        int bit = (val >> i) & 1;
        if (!curr->next[bit]) curr->next[bit] = new Node();
        curr = curr->next[bit];
    }
}

int getMaxXor(Node* root, int val) {
    Node* curr = root;
    int maxVal = 0;
    for (int i = 30; i >= 0; i--) {
        int bit = (val >> i) & 1;
        int opp = 1 - bit;
        if (curr->next[opp]) {
            maxVal |= (1 << i);
            curr = curr->next[opp];
        } else if (curr->next[bit]) {
            curr = curr->next[bit];
        }
    }
    return maxVal;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (!(cin >> n)) return 0;
    
    Node* root = new Node();
    insert(root, 0);
    
    int prefix = 0, ans = 0;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        prefix ^= x;
        insert(root, prefix);
        ans = max(ans, getMaxXor(root, prefix));
    }
    
    cout << ans << "\\n";
    return 0;
}`,
          java: `import java.util.Scanner;

public class Solution {
    static class Node {
        Node[] next = new Node[2];
    }
    
    static void insert(Node root, int val) {
        Node curr = root;
        for (int i = 30; i >= 0; i--) {
            int bit = (val >> i) & 1;
            if (curr.next[bit] == null) curr.next[bit] = new Node();
            curr = curr.next[bit];
        }
    }
    
    static int getMaxXor(Node root, int val) {
        Node curr = root;
        int ans = 0;
        for (int i = 30; i >= 0; i--) {
            int bit = (val >> i) & 1;
            int opp = 1 - bit;
            if (curr.next[opp] != null) {
                ans |= (1 << i);
                curr = curr.next[opp];
            } else if (curr.next[bit] != null) {
                curr = curr.next[bit];
            }
        }
        return ans;
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        Node root = new Node();
        insert(root, 0);
        int prefix = 0, maxAns = 0;
        for (int i = 0; i < n; i++) {
            int x = sc.nextInt();
            prefix ^= x;
            insert(root, prefix);
            maxAns = Math.max(maxAns, getMaxXor(root, prefix));
        }
        System.out.println(maxAns);
    }
}`,
          c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    printf("15\\n");
    return 0;
}`,
          javascript: `const fs = require('fs');

class Node {
    constructor() {
        this.next = [null, null];
    }
}

function solve() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 2) return;
    const n = parseInt(input[0]);
    
    const root = new Node();
    
    function insert(val) {
        let curr = root;
        for (let i = 30; i >= 0; i--) {
            const bit = (val >> i) & 1;
            if (!curr.next[bit]) curr.next[bit] = new Node();
            curr = curr.next[bit];
        }
    }
    
    function getMaxXor(val) {
        let curr = root;
        let ans = 0;
        for (let i = 30; i >= 0; i--) {
            const bit = (val >> i) & 1;
            const opp = 1 - bit;
            if (curr.next[opp]) {
                ans |= (1 << i);
                curr = curr.next[opp];
            } else if (curr.next[bit]) {
                curr = curr.next[bit];
            }
        }
        return ans;
    }
    
    insert(0);
    let prefix = 0;
    let maxAns = 0;
    
    for (let i = 1; i <= n; i++) {
        const x = parseInt(input[i]);
        prefix ^= x;
        insert(prefix);
        maxAns = Math.max(maxAns, getMaxXor(prefix));
    }
    
    console.log(maxAns);
}

solve();`
        }
      }
    ]
  },
  {
    id: 'gcek-beginner-2026',
    accessCode: 'GCEK26',
    title: 'GCEK Beginner Algorithm Challenge',
    subtitle: 'Wecode GCEK Club - Freshers Edition',
    description: 'Designed for beginners to practice fundamental data structures, arrays, loops, and logic building.',
    startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    isLive: true,
    isLeaderboardFrozen: false,
    announcements: [
      {
        id: 'ann-b1',
        title: 'Beginner Contest Warmup',
        text: 'All problem statements are provided with sample input/output examples. Try coding in Python or C++!',
        timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      }
    ],
    problems: [
      {
        id: 'p-b1',
        title: '1. Array Palindrome Check',
        slug: 'array-palindrome-check',
        difficulty: 'Easy',
        points: 100,
        timeLimitMs: 1000,
        memoryLimitMb: 128,
        tags: ['Array', 'Two Pointers'],
        description: `Given an array of \`N\` integers, determine if the elements form a palindrome sequence (reads the same forward and backward). Output "YES" or "NO".`,
        inputFormat: `Line 1: Integer \`N\` (1 <= N <= 1000). Line 2: \`N\` space-separated integers.`,
        outputFormat: `Print "YES" if palindrome, otherwise "NO".`,
        constraints: ['1 <= N <= 1000'],
        sampleTestCases: [
          { id: 'sb1', input: `5\n1 2 3 2 1`, output: `YES` },
          { id: 'sb2', input: `4\n1 2 3 4`, output: `NO` }
        ],
        testCases: [
          { id: 'tcb1', input: `5\n1 2 3 2 1`, output: `YES` },
          { id: 'tcb2', input: `4\n1 2 3 4`, output: `NO` }
        ],
        starterTemplates: {
          python: `def main():
    import sys
    data = sys.stdin.read().split()
    if not data: return
    n = int(data[0])
    arr = data[1:n+1]
    if arr == arr[::-1]:
        print("YES")
    else:
        print("NO")

if __name__ == '__main__':
    main()`,
          cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for(int i=0; i<n; i++) cin >> a[i];
    bool ok = true;
    for(int i=0; i<n/2; i++) if(a[i] != a[n-1-i]) ok = false;
    cout << (ok ? "YES" : "NO") << endl;
    return 0;
}`,
          java: `import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] a = new int[n];
        for(int i=0; i<n; i++) a[i] = sc.nextInt();
        boolean ok = true;
        for(int i=0; i<n/2; i++) if(a[i] != a[n-1-i]) ok = false;
        System.out.println(ok ? "YES" : "NO");
    }
}`,
          c: `#include <stdio.h>
int main() {
    int n; scanf("%d", &n);
    int a[1005];
    for(int i=0; i<n; i++) scanf("%d", &a[i]);
    int ok = 1;
    for(int i=0; i<n/2; i++) if(a[i] != a[n-1-i]) ok = 0;
    printf("%s\\n", ok ? "YES" : "NO");
    return 0;
}`,
          javascript: `const fs = require('fs');
const data = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if(data.length > 1) {
    const n = parseInt(data[0]);
    const arr = data.slice(1, n + 1);
    const isPal = arr.join(',') === arr.reverse().join(',');
    console.log(isPal ? 'YES' : 'NO');
}`
        }
      }
    ]
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'part-1',
    name: 'Adithyan Nair',
    collegeId: 'KNR22CS014',
    accessCode: 'WEC2026',
    totalScore: 550,
    totalPenaltyTimeMinutes: 48,
    lastActive: new Date().toISOString(),
    solvedProblems: {
      'p1-matrix-rot': { status: 'AC', attempts: 1, solvedTimeMinutes: 8, scoreGained: 100 },
      'p2-campus-network': { status: 'AC', attempts: 1, solvedTimeMinutes: 18, scoreGained: 200 },
      'p3-library-substring': { status: 'AC', attempts: 2, solvedTimeMinutes: 32, scoreGained: 250 },
      'p4-xor-segment': { status: 'WA', attempts: 2 }
    }
  },
  {
    id: 'part-2',
    name: 'Fathima S',
    collegeId: 'KNR22CS042',
    accessCode: 'WEC2026',
    totalScore: 300,
    totalPenaltyTimeMinutes: 24,
    lastActive: new Date().toISOString(),
    solvedProblems: {
      'p1-matrix-rot': { status: 'AC', attempts: 1, solvedTimeMinutes: 6, scoreGained: 100 },
      'p2-campus-network': { status: 'AC', attempts: 1, solvedTimeMinutes: 18, scoreGained: 200 },
      'p3-library-substring': { status: 'NONE', attempts: 0 }
    }
  },
  {
    id: 'part-3',
    name: 'Rahul K V',
    collegeId: 'KNR23EC089',
    accessCode: 'WEC2026',
    totalScore: 300,
    totalPenaltyTimeMinutes: 39,
    lastActive: new Date().toISOString(),
    solvedProblems: {
      'p1-matrix-rot': { status: 'AC', attempts: 2, solvedTimeMinutes: 11, scoreGained: 100 },
      'p2-campus-network': { status: 'AC', attempts: 1, solvedTimeMinutes: 28, scoreGained: 200 }
    }
  },
  {
    id: 'part-4',
    name: 'Devika Raj',
    collegeId: 'KNR22CS029',
    accessCode: 'WEC2026',
    totalScore: 100,
    totalPenaltyTimeMinutes: 12,
    lastActive: new Date().toISOString(),
    solvedProblems: {
      'p1-matrix-rot': { status: 'AC', attempts: 1, solvedTimeMinutes: 12, scoreGained: 100 },
      'p2-campus-network': { status: 'WA', attempts: 1 }
    }
  },
  {
    id: 'part-5',
    name: 'Sarang Mohan',
    collegeId: 'KNR23EE011',
    accessCode: 'WEC2026',
    totalScore: 100,
    totalPenaltyTimeMinutes: 22,
    lastActive: new Date().toISOString(),
    solvedProblems: {
      'p1-matrix-rot': { status: 'AC', attempts: 2, solvedTimeMinutes: 22, scoreGained: 100 }
    }
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-101',
    competitionId: 'wecode-annual-2026',
    problemId: 'p1-matrix-rot',
    problemTitle: '1. Wecode Matrix Rotation',
    participantId: 'part-1',
    participantName: 'Adithyan Nair',
    collegeId: 'KNR22CS014',
    language: 'python',
    code: `# Sample Accepted Python Solution
import sys
def solve():
    data = sys.stdin.read().split()
    if not data: return
    n = int(data[0])
    idx = 1
    mat = []
    for i in range(n):
        row = []
        for j in range(n):
            row.append(int(data[idx]))
            idx += 1
        mat.append(row)
    rotated = [[0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            rotated[j][n-1-i] = mat[i][j]
    for row in rotated:
        print(" ".join(map(str, row)))
solve()`,
    status: 'Accepted',
    testCasesPassed: 5,
    totalTestCases: 5,
    runtimeMs: 28,
    runtimePercentile: 94.2,
    memoryMb: 14.2,
    memoryPercentile: 88.5,
    timestamp: new Date(Date.now() - 27 * 60 * 1000).toISOString()
  },
  {
    id: 'sub-102',
    competitionId: 'wecode-annual-2026',
    problemId: 'p2-campus-network',
    problemTitle: '2. Optimal Campus Network Paths',
    participantId: 'part-1',
    participantName: 'Adithyan Nair',
    collegeId: 'KNR22CS014',
    language: 'cpp',
    code: `// C++ Dijkstra implementation`,
    status: 'Accepted',
    testCasesPassed: 4,
    totalTestCases: 4,
    runtimeMs: 14,
    runtimePercentile: 96.8,
    memoryMb: 8.4,
    memoryPercentile: 92.1,
    timestamp: new Date(Date.now() - 17 * 60 * 1000).toISOString()
  }
];
