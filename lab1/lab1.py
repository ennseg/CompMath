import math
import os

def read_from_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
        
        if len(lines) < 5:
            print("Ошибка: недостаточно строк в файле")
            return None
        
        n = int(lines[0])
        if n < 2 or n > 20:
            print("Ошибка: размерность должна быть 2 <= n <= 20")
            return None
        
        A = []
        for i in range(1, n + 1):
            row = list(map(float, lines[i].split()))
            if len(row) != n:
                print(f"Ошибка: строка {i} должна содержать {n} элементов")
                return None
            A.append(row)
        
        b = list(map(float, lines[n + 1].split()))
        if len(b) != n:
            print(f"Ошибка: вектор b должен содержать {n} элементов")
            return None
        
        eps = float(lines[n + 2])
        if eps <= 0:
            print("Ошибка: точность должна быть больше 0")
            return None
        
        max_iter = int(lines[n + 3]) if len(lines) > n + 3 else 0
        
        print(f"Данные успешно загружены из файла '{filename}'")
        return n, A, b, eps, max_iter
    
    except FileNotFoundError:
        print(f"Ошибка: файл '{filename}' не найден")
        return None
    except ValueError as e:
        print(f"Ошибка формата данных в файле: {e}")
        return None
    except Exception as e:
        print(f"Ошибка при чтении файла: {e}")
        return None

def get_data():
    print("\nВыберите источник данных:")
    print("1. Ввод с клавиатуры")
    print("2. Ввод из файла")
    
    while True:
        choice = input("Ваш выбор (1 или 2): ").strip()
        if choice == '1':
            return get_data_keyboard()
        elif choice == '2':
            filename = input("Введите имя файла в формате .txt: ").strip()
            data = read_from_file(filename)
            if data:
                return data
            print("Повторите выбор источника данных")
        else:
            print("Ошибка: введите 1 или 2")

def get_data_keyboard():
    while True:
        try:
            n = int(input("Введите размер матрицы 2<=n<=20: "))
            if 2 <= n <= 20:
                break
            print("Ошибка: число должно быть в диапазоне от 2 до 20")
        except ValueError:
            print("Ошибка: введите целое число")

    A = []
    for i in range(n):
        while True:
            try:
                line = input(f"Введите строку {i+1}/{n} (через пробел, {n} элементов): ")
                row = list(map(float, line.split()))
                
                if len(row) == n:
                    A.append(row)
                    break
                else:
                    print(f"Ошибка: строка должна содержать ровно {n} элементов")
            except ValueError:
                print("Ошибка: в строке должны быть только числа")
     
    while True:
        try:
            b = list(map(float, input("Введите вектор правых частей b (через пробел): ").split()))
            if len(b) == n:
                break
            print(f"Ошибка: в векторе должно быть ровно {n} элементов")
        except ValueError:
            print("Ошибка: в векторе должны быть только числа")

    while True:
        try:
            e = float(input("Введите точность приближения: "))
            if e > 0:
                break
            print("Ошибка: точность должна быть больше 0")
        except ValueError:
            print("Ошибка: введите число")
            
    while True:
        try:
            max_i = int(input("Вы можете ввести максимальное число итераций, чтобы проигнорировать этот параметр введите 0:"))
            if max_i >= 0:
                break
            print("Ошибка: максимальное число итераций должно быть не меньше нуля")
        except ValueError:
            print("Ошибка: введите целое число")
            
    return n, A, b, e, max_i

def check_diagonal(A, n):
    for i in range(n):
        diag = abs(A[i][i])
        row_sum = sum(abs(A[i][j]) for j in range(n) if j != i)
        if diag <= row_sum:
            return False
    return True

def diagonal_transformation(A, b, n):
    A_work = [row[:] for row in A]
    b_work = b[:]
    used_rows = [False] * n

    for i in range(n):
        found = False
        for k in range(n):
            if used_rows[k]:
                continue
                        
            diag_val = abs(A_work[k][i])
            sum_val = sum(abs(A_work[k][j]) for j in range(n) if j != i)
            
            if diag_val > sum_val:
                A_work[i], A_work[k] = A_work[k], A_work[i]
                b_work[i], b_work[k] = b_work[k], b_work[i]
                used_rows[k] = True
                found = True
                break
        
        if not found:
            max_val = abs(A_work[i][i])
            max_idx = i
            for k in range(i + 1, n):
                if abs(A_work[k][i]) > max_val:
                    max_val = abs(A_work[k][i])
                    max_idx = k
            
            if max_idx != i:
                A_work[i], A_work[max_idx] = A_work[max_idx], A_work[i]
                b_work[i], b_work[max_idx] = b_work[max_idx], b_work[i]

    if check_diagonal(A_work, n):
        print("Диагональное преобладание достигнуто перестановкой строк")
        return A_work, b_work
    else:
        print("Предупреждение: Не удалось достичь строгого диагонального преобладания")
        print("Сходимость метода не гарантирована, но вычисления будут продолжены")
        return A_work, b_work
    
def calculate_norm(A, n):
    max_row_sum = 0
    for i in range(n):
        if abs(A[i][i]) < 1e-9:
            continue
        row_sum = 0
        for j in range(n):
            if i != j:
                row_sum += abs(A[i][j] / A[i][i])
        if row_sum > max_row_sum:
            max_row_sum = row_sum
    return max_row_sum

def calculate_SLAU(A, b, eps, max_iter, n):
    x = [0.0] * n
            
    x_prev = x[:]
    iterations = 0
    error_vector = []

    if max_iter == 0: 
        max_iter = 1000000

    while iterations < max_iter:
        iterations += 1
        max_diff = 0.0
        current_errors = []

        for i in range(n):
            sum_left = sum(A[i][j] * x[j] for j in range(i))
            sum_right = sum(A[i][j] * x_prev[j] for j in range(i + 1, n))
            
            if abs(A[i][i]) < 1e-9:
                print("Ошибка: нулевой диагональный элемент")
                return None, iterations, []

            x_new_i = (b[i] - sum_left - sum_right) / A[i][i]
            
            diff = abs(x_new_i - x_prev[i])
            current_errors.append(diff)
            
            if diff > max_diff:
                max_diff = diff
            
            x[i] = x_new_i

        error_vector.append(current_errors)

        if max_diff < eps:
            print(f"\nСходимость достигнута на итерации {iterations}")
            break
        
        x_prev = x[:]

    if iterations == max_iter and max_diff >= eps:
        print("\nВнимание: Достигнуто максимальное число итераций без сходимости")

    return x, iterations, error_vector[-1] if error_vector else []

def main():
    n, A, b, eps, max_iter = get_data()
    
    if not check_diagonal(A, n):
        print("Исходная матрица не имеет диагонального преобладания")
        A, b = diagonal_transformation(A, b, n)
    else:
        print("Исходная матрица имеет диагональное преобладание")
        
    norm = calculate_norm(A, n)
    print(f"\nНорма матрицы итерации: {norm:.4f}")
    if norm < 1:
        print("Условие сходимости (||C|| < 1) выполняется")
    else:
        print("Условие сходимости (||C|| < 1) не выполняется")
        
    res, iters, final_errors = calculate_SLAU(A, b, eps, max_iter, n)
    
    if res:
        print("\nРезультат\n")
        print(f"Количество итераций: {iters}")
        print("Вектор решения X:")
        for i, val in enumerate(res):
            print(f"x[{i+1}] = {val:.6f}")
        
        print("\nВектор погрешностей на последнем шаге |x(k) - x(k-1)|:")
        for i, err in enumerate(final_errors):
            print(f"err[{i+1}] = {err:.6f}")

while __name__ == "__main__":
    main()