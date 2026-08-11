import argparse
import json
import random

# CLI argument parser to receive deterministic seed from tally-gen
parser = argparse.ArgumentParser(
    description="Add test case gen")
parser.add_argument('--seed', type=int, required=True,
                    help="Random seed for deterministic generation")
args = parser.parse_args()

random.seed(args.seed)

a = random.randint(10, 50)
b = random.randint(50, 100)


print(json.dumps({"a": a, "b": b}))
