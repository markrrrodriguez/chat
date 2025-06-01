import random
import hashlib

# Settings
L = 3  # Length of n and j
Q = 2  # Length of m
MAX_STEPS = 1000000  # Prevent infinite loop

# Generate all binary numbers of length L
def generate_all_binary(L):
    return [list(map(int, f"{i:0{L}b}")) for i in range(2 ** L)]

# Check if list of n's is a perfect count-up
def is_perfect_count(n_history):
    target = generate_all_binary(L)
    return n_history == target

# Compute checksum of a list of n values (we'll use SHA256 for demo purposes)
def compute_checksum(n_history):
    flat = ''.join(''.join(map(str, n)) for n in n_history)
    return hashlib.sha256(flat.encode()).hexdigest()

# Initialization
m = [0] * Q
n_history = []
j_history = []
steps = 0

# Preselect a checksum that is NOT the checksum of the perfect run
perfect_run = generate_all_binary(L)
perfect_checksum = compute_checksum(perfect_run)
target_checksum = perfect_checksum[::-1]  # Just reverse for a different one

while steps < MAX_STEPS:
    steps += 1

    # Generate new random n
    n = [random.randint(0, 1) for _ in range(L)]
    j = n.copy()

    # Update histories
    n_history.append(n)
    j_history.append(j)

    # Check j == n every step
    if j != n:
        print("j ≠ n — restarting")
        n_history.clear()
        j_history.clear()
        m = [1] * Q
        continue

    # Check if current history is a perfect count-up
    if len(n_history) == 2 ** L:
        if is_perfect_count(n_history):
            print(f"Perfect count found at step {steps}")
            # Attempt to clear m
            for i in range(Q):
                if all(x == 0 for x in m[:i+1]):
                    m[i] = 0
                else:
                    break
            if all(x == 0 for x in m):
                # If m is all zero again, halt if checksum matches target
                checksum = compute_checksum(n_history)
                if checksum == target_checksum:
                    print(f"✨ Program HALTED successfully at step {steps}")
                    break
                else:
                    print(f"Perfect count, but checksum mismatch — continuing")
        else:
            # Failed sequence, reset m
            m = [1] * Q

        # Regardless, reset n_history for next attempt
        n_history.clear()

else:
    print("☠️ Max steps reached without halting.")
