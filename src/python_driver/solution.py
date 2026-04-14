# id=70 slug=climbing-stairs lang=python3

from typing import List


class Solution:
    def twoSum(self, nums: List[int], target: int) -> int:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
