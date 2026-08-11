def solve(nums: list[int]) -> int:
    """
    Solves the House Robber problem using Dynamic Programming.
    Returns the maximum money that can be robbed without robbing adjacent houses.
    """
    if not nums:
        return 0

    prev1 = 0  # Maximum money robbed up to house i - 1
    prev2 = 0  # Maximum money robbed up to house i - 2

    for num in nums:
        current = max(prev1, prev2 + num)
        prev2 = prev1
        prev1 = current

    return prev1
