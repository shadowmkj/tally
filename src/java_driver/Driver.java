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
        if (args.length < 1) {
            System.out.println("{\"success\": false, \"error\": \"Internal Error: Method name missing.\"}");
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
            String msg = String.format(
                    "{\"success\": false, \"error\": \"Method '%s' not found. Did you change the function signature?\"}",
                    escapeJson(methodName));
            System.out.println(msg);
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
                    ObjectMapper mapper = new ObjectMapper();

                    JsonNode root;
                    try {
                        root = mapper.readTree(line);
                    } catch (JsonProcessingException e) {
                        String errMsg = escapeJson("Invalid JSON: " + e.getOriginalMessage());
                        String out = String.format("{\"success\": false, \"error\": \"%s\"}", errMsg);
                        System.out.println(out);
                        continue;
                    }

                    if (!root.isObject()) {
                        String err = "{\"success\": false, \"error\": \"Expected a JSON object with named parameters.\"}";
                        System.out.println(err);
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
                        String err = "{\"success\": false, \"error\": \"Parameter mismatch: Not enough parameters provided. Please provide all parameters.\"}";
                        System.out.println(err);
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
                         String errMsg = escapeJson("Failed to serialize result: " + e.getOriginalMessage());
                         String out = String.format("{\"success\": false, \"error\": \"%s\"}", errMsg);
                         System.out.println(out);
                         continue;
                     }

                     String out = String.format("{\"success\": true, \"result\": %s}", resultJson);
                     System.out.println(out);

                } catch (IllegalAccessException | InvocationTargetException e) {
                    Throwable cause = e instanceof InvocationTargetException && e.getCause() != null
                            ? e.getCause()
                            : e;
                    String errMsg = escapeJson(cause.toString());
                    String out = String.format("{\"success\": false, \"error\": \"%s\"}", errMsg);
                    System.out.println(out);
                } catch (RuntimeException e) {
                    String errMsg = escapeJson(e.toString());
                    String out = String.format("{\"success\": false, \"error\": \"%s\"}", errMsg);
                    System.out.println(out);
                }
            }
        } catch (IOException e) {
            String errMsg = escapeJson(e.toString());
            String out = String.format("{\"success\": false, \"error\": \"%s\"}", errMsg);
            System.out.println(out);
        }
     }

    // Keep escapeJson for error messages.

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
