    .text
    .globl my_jmp
    .def my_jmp; .scl 2; .type 32; .endef
my_jmp:
    jmp *%rcx
