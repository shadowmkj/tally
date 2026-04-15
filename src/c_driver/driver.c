#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dlfcn.h>
#include <ffi.h>
#include <stdbool.h>
#include "cJSON.h"

void print_error(const char* msg) {
    cJSON *resp = cJSON_CreateObject();
    cJSON_AddFalseToObject(resp, "success");
    cJSON_AddStringToObject(resp, "error", msg);
    char *out = cJSON_PrintUnformatted(resp);
    printf("%s\n", out);
    free(out);
    cJSON_Delete(resp);
}

int main(int argc, char** argv) {
    if (argc < 3) {
        print_error("Internal Error: Method name or schema missing.");
        return 1;
    }
    
    const char *method_name = argv[1];
    const char *schema = argv[2]; // e.g. "[i],i:[i]"

    // Load shared solution library
    void *handle = dlopen("./solution.so", RTLD_LAZY);
    if (!handle) {
        char err[1024];
        snprintf(err, sizeof(err), "Failed to load solution: %s", dlerror());
        print_error(err);
        return 1;
    }

    void *target_func = dlsym(handle, method_name);
    if (!target_func) {
        char err[1024];
        snprintf(err, sizeof(err), "Method '%s' not found. Check signature?", method_name);
        print_error(err);
        return 1;
    }

    char schema_copy[256];
    strncpy(schema_copy, schema, 255);
    schema_copy[255] = '\0';

    char *colon = strchr(schema_copy, ':');
    const char *ret_schema_str = "v";
    if (colon) {
        *colon = '\0';
        ret_schema_str = colon + 1;
    }
    char *in_schema_str = schema_copy;

    ffi_type *ret_ffi_type = &ffi_type_void;
    bool ret_is_array = false;
    if (strcmp(ret_schema_str, "i") == 0 || strcmp(ret_schema_str, "b") == 0) {
        ret_ffi_type = &ffi_type_sint32;
    } else if (strcmp(ret_schema_str, "d") == 0) {
        ret_ffi_type = &ffi_type_double;
    } else if (strcmp(ret_schema_str, "[i]") == 0 || strcmp(ret_schema_str, "s") == 0) {
        ret_ffi_type = &ffi_type_pointer;
        if (strcmp(ret_schema_str, "[i]") == 0) ret_is_array = true;
    } else if (strcmp(ret_schema_str, "v") == 0 || strlen(ret_schema_str) == 0) {
        ret_ffi_type = &ffi_type_void;
    } else {
        print_error("Unknown return schema");
        return 1;
    }

    char* in_tokens[32];
    int num_in_tokens = 0;
    if (strlen(in_schema_str) > 0) {
        char* token = strtok(in_schema_str, ",");
        while(token && num_in_tokens < 32) {
            in_tokens[num_in_tokens++] = token;
            token = strtok(NULL, ",");
        }
    }

    ffi_type *arg_types[64];
    int num_args = 0;
    for (int i = 0; i < num_in_tokens; i++) {
        if (strcmp(in_tokens[i], "i") == 0 || strcmp(in_tokens[i], "b") == 0) {
            arg_types[num_args++] = &ffi_type_sint32;
        } else if (strcmp(in_tokens[i], "d") == 0) {
            arg_types[num_args++] = &ffi_type_double;
        } else if (strcmp(in_tokens[i], "[i]") == 0) {
            arg_types[num_args++] = &ffi_type_pointer;
            arg_types[num_args++] = &ffi_type_sint32;
        } else if (strcmp(in_tokens[i], "s") == 0) {
            arg_types[num_args++] = &ffi_type_pointer;
        }
    }

    if (ret_is_array) {
        arg_types[num_args++] = &ffi_type_pointer;
    }

    ffi_cif cif;
    if (ffi_prep_cif(&cif, FFI_DEFAULT_ABI, num_args, ret_ffi_type, arg_types) != FFI_OK) {
        print_error("FFI prep failed.");
        return 1;
    }

    char buffer[65536];
    while (fgets(buffer, sizeof(buffer), stdin)) {
        size_t len = strlen(buffer);
        while(len > 0 && (buffer[len-1] == '\n' || buffer[len-1] == '\r')) {
            buffer[--len] = '\0';
        }
        if (len == 0) continue;

        cJSON *root = cJSON_Parse(buffer);
        if(!root) {
            print_error("Invalid JSON input.");
            continue;
        }

        void *arg_values[64];
        int *int_arrays[32];
        int num_int_arrays = 0;
        int arg_idx = 0;
        cJSON *current_item = root->child;

        int static_ints[64];
        double static_doubles[64];
        void* static_ptrs[64];

        int tok_idx = 0;
        bool parse_fail = false;

        for (; tok_idx < num_in_tokens; tok_idx++) {
            if (!current_item) {
                print_error("Not enough parameters in JSON.");
                parse_fail = true;
                break;
            }

            if (strcmp(in_tokens[tok_idx], "i") == 0 || strcmp(in_tokens[tok_idx], "b") == 0) {
                static_ints[arg_idx] = current_item->valueint;
                arg_values[arg_idx] = &static_ints[arg_idx];
                arg_idx++;
            } else if (strcmp(in_tokens[tok_idx], "d") == 0) {
                static_doubles[arg_idx] = current_item->valuedouble;
                arg_values[arg_idx] = &static_doubles[arg_idx];
                arg_idx++;
            } else if (strcmp(in_tokens[tok_idx], "s") == 0) {
                static_ptrs[arg_idx] = current_item->valuestring;
                arg_values[arg_idx] = &static_ptrs[arg_idx];
                arg_idx++;
            } else if (strcmp(in_tokens[tok_idx], "[i]") == 0) {
                int arr_sz = cJSON_GetArraySize(current_item);
                int* arr = (int*)malloc(arr_sz * sizeof(int));
                int j = 0;
                cJSON *elem = current_item->child;
                while(elem) {
                    arr[j++] = elem->valueint;
                    elem = elem->next;
                }
                int_arrays[num_int_arrays++] = arr;

                static_ptrs[arg_idx] = arr;
                arg_values[arg_idx] = &static_ptrs[arg_idx];
                arg_idx++;

                static_ints[arg_idx] = arr_sz;
                arg_values[arg_idx] = &static_ints[arg_idx];
                arg_idx++;
            }
            
            current_item = current_item->next;
        }

        if (parse_fail) {
            cJSON_Delete(root);
            for(int i=0;i<num_int_arrays;i++) free(int_arrays[i]);
            continue;
        }

        int returnSizeValue = 0;
        int* pReturnSize = &returnSizeValue;
        if (ret_is_array) {
            static_ptrs[arg_idx] = pReturnSize;
            arg_values[arg_idx] = &static_ptrs[arg_idx];
            arg_idx++;
        }

        long long ret_sint = 0;
        double ret_double = 0;
        void *ret_ptr = NULL;
        void *ret_val_addr;

        if (ret_ffi_type == &ffi_type_sint32) ret_val_addr = &ret_sint;
        else if (ret_ffi_type == &ffi_type_double) ret_val_addr = &ret_double;
        else if (ret_ffi_type == &ffi_type_pointer) ret_val_addr = &ret_ptr;
        else ret_val_addr = &ret_sint;

        ffi_call(&cif, FFI_FN(target_func), ret_val_addr, arg_values);

        cJSON *resp = cJSON_CreateObject();
        cJSON_AddTrueToObject(resp, "success");
        
        cJSON *res_node = NULL;
        if (ret_ffi_type == &ffi_type_sint32) {
            if (strcmp(ret_schema_str, "b") == 0)
                res_node = cJSON_CreateBool((int)ret_sint);
            else
                res_node = cJSON_CreateNumber((int)ret_sint);
        } else if (ret_ffi_type == &ffi_type_double) {
            res_node = cJSON_CreateNumber(ret_double);
        } else if (ret_is_array) {
            res_node = cJSON_CreateArray();
            int* r_arr = (int*)ret_ptr;
            for(int i=0; i<returnSizeValue; i++) {
                cJSON_AddItemToArray(res_node, cJSON_CreateNumber(r_arr[i]));
            }
            free(ret_ptr); 
        } else if (strcmp(ret_schema_str, "s") == 0) {
            res_node = cJSON_CreateString((char*)ret_ptr);
        } else {
            res_node = cJSON_CreateNull();
        }

        cJSON_AddItemToObject(resp, "result", res_node);

        char *out = cJSON_PrintUnformatted(resp);
        printf("%s\n", out);
        fflush(stdout); 
        free(out);

        cJSON_Delete(resp);
        cJSON_Delete(root);
        for(int i=0;i<num_int_arrays;i++) free(int_arrays[i]);
    }

    return 0;
}
