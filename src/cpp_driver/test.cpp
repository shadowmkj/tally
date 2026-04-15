#include "json.hpp"
#include <iostream>
int main() { nlohmann::json root = 1; std::cout << root.dump(); return 0; }
