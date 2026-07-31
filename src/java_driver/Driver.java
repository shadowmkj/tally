import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

// Minimal JSON handling tailored to the test payloads.
// This is not a general-purpose JSON parser, but enough
// for simple key/value arguments like {"n": 5}.
public class Driver {
    public static void main(String[] args) {
        ObjectMapper mapper = new ObjectMapper();

        if (args.length < 1) {
            printError(mapper, "Internal Error: Method name missing.");
            System.exit(1);
        }

        String methodName = args[0];
        Solution sol = new Solution();

        Method targetMethod;
        try {
            // Look up the method by name, allowing any parameter types.
            // If there are overloaded methods, prefer the one with the most parameters,
            // which matches typical problem signatures (e.g. twoSum(int[] nums, int target)).
            Method best = null;
            for (Method m : Solution.class.getMethods()) {
                if (!m.getName().equals(methodName)) {
                    continue;
                }
                if (best == null || m.getParameterCount() > best.getParameterCount()) {
                    best = m;
                }
            }

            if (best == null) {
                throw new NoSuchMethodException(methodName);
            }

            targetMethod = best;
        } catch (NoSuchMethodException e) {
            printError(mapper, String.format("Method '%s' not found. Did you change the function signature?", methodName));
            System.exit(1);
            return;
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }

                try {
                    JsonNode root;
                    try {
                        root = mapper.readTree(line);
                    } catch (JsonProcessingException e) {
                        printError(mapper, "Invalid JSON: " + e.getOriginalMessage());
                        continue;
                    }

                    if (!root.isObject()) {
                        printError(mapper, "Expected a JSON object with named parameters.");
                        continue;
                    }

                    Class<?>[] paramTypes = targetMethod.getParameterTypes();
                    Object[] invokeArgs = new Object[paramTypes.length];

                    // Preserve input field order so we can map by position
                    // to method parameters: {"nums": ..., "target": ...}
                    Map<String, JsonNode> orderedFields = new LinkedHashMap<>();
                    Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
                    while (fields.hasNext()) {
                        Map.Entry<String, JsonNode> entry = fields.next();
                        orderedFields.put(entry.getKey(), entry.getValue());
                    }

                    if (orderedFields.size() < paramTypes.length) {
                        printError(mapper, "Parameter mismatch: Not enough parameters provided. Please provide all parameters.");
                        continue;
                    }

                    JsonNode[] orderedValues = orderedFields.values().toArray(new JsonNode[0]);

                    for (int i = 0; i < paramTypes.length; i++) {
                        Class<?> paramType = paramTypes[i];
                        JsonNode valueNode = orderedValues[i];
                        // Let Jackson perform full conversion, including primitives, arrays,
                        // and collections into the exact parameter type.
                        invokeArgs[i] = mapper.convertValue(valueNode, mapper.getTypeFactory().constructType(paramType));
                    }

                    Object result = targetMethod.invoke(sol, invokeArgs);

                    // Serialize the result as proper JSON (handles arrays, primitives, objects).
                    String resultJson;
                    try {
                        resultJson = mapper.writeValueAsString(result);
                    } catch (JsonProcessingException e) {
                        printError(mapper, "Failed to serialize result: " + e.getOriginalMessage());
                        continue;
                    }

                    String out = String.format("{\"success\": true, \"result\": %s}", resultJson);
                    System.out.println(out);

                } catch (Throwable t) {
                    Throwable cause = (t instanceof InvocationTargetException && t.getCause() != null)
                            ? t.getCause()
                            : t;
                    printError(mapper, cause.toString());
                }
            }
        } catch (IOException e) {
            printError(mapper, e.toString());
        }
    }

    private static void printError(ObjectMapper mapper, String message) {
        Map<String, Object> errResp = new LinkedHashMap<>();
        errResp.put("success", false);
        errResp.put("error", message);
        try {
            System.out.println(mapper.writeValueAsString(errResp));
        } catch (JsonProcessingException e) {
            System.out.println("{\"success\": false, \"error\": \"Runtime Error\"}");
        }
    }
}
