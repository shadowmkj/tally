import sys
import json
import traceback
from solution import Solution


def main():
    # 1. The Rust engine passes the target method name as a command-line argument
    if len(sys.argv) < 2:
        print(json.dumps(
            {"success": False, "error": "Internal Error: Method name missing."}))
        sys.exit(1)

    method_name = sys.argv[1]
    sol = Solution()

    # 2. Dynamically locate the method inside the Solution class
    try:
        target_method = getattr(sol, method_name)
    except AttributeError:
        # If the user changed the method name (e.g., from 'twoSum' to 'myFunction')
        print(json.dumps({
            "success": False,
            "error": f"Method '{method_name}' not found. Did you change the function signature?"
        }))
        sys.exit(1)

    # 3. Process test cases from Standard Input line-by-line
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            # Parse the JSON test case payload
            # Example: {"nums": [2, 7, 11, 15], "target": 9}
            kwargs = json.loads(line)

            # 4. Execute dynamically using **kwargs unpacking
            # This maps the JSON keys directly to the function's parameters
            result = target_method(**kwargs)

            # Print the successful result back to Rust
            print(json.dumps({"success": True, "result": result}))

        except TypeError as e:
            # Catches if the user changed the parameter names (e.g., 'array' instead of 'nums')
            print(json.dumps({
                "success": False,
                "error": f"Parameter mismatch: {str(e)}. Please use the exact parameter names provided."
            }))
        except Exception as e:
            # 5. Catch any runtime errors (IndexError, ZeroDivisionError, etc.) inside the user's code
            error_msg = "".join(
                traceback.format_exception_only(type(e), e)).strip()
            print(json.dumps({"success": False, "error": error_msg}))


if __name__ == "__main__":
    main()
