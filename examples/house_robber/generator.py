import argparse
import json
import random

# CLI argument parser to receive deterministic seed from tally-gen
parser = argparse.ArgumentParser(description="House Robber Test Case Generator")
parser.add_argument('--seed', type=int, required=True, help="Random seed for deterministic generation")
args = parser.parse_args()

# Seed random number generator
random.seed(args.seed)

# Generate number of houses (1 <= n <= 100)
n = random.randint(1, 100)

# Generate money stashed in each house (0 <= nums[i] <= 400)
nums = [random.randint(0, 400) for _ in range(n)]

# Output parameter dictionary as JSON
print(json.dumps({"nums": nums}))
