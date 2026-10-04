export const defaultChallengesSY = [
  {
    id: 'sy-1',
    title: 'Check Prime Number',
    language: 'python',
    code: [
      'def is_prime(n):',
      '    if n <= 1:',
      '        return False',
      '    for i in range(2, int(n ** 0.5) + 1):',
      '        if n % i == 0:',
      '            return False',
      '    return True',
      '',
      'num = 29',
      'if is_prime(num):',
      '    print(f"{num} is prime")',
      'else:',
      '    print(f"{num} is not prime")'
    ]
  },
  {
    id: 'sy-2',
    title: 'Bubble Sort Array',
    language: 'javascript',
    code: [
      'function bubbleSort(arr) {',
      '  const n = arr.length;',
      '  for (let i = 0; i < n - 1; i++) {',
      '    for (let j = 0; j < n - i - 1; j++) {',
      '      if (arr[j] > arr[j + 1]) {',
      '        let temp = arr[j];',
      '        arr[j] = arr[j + 1];',
      '        arr[j + 1] = temp;',
      '      }',
      '    }',
      '  }',
      '  return arr;',
      '}',
      'console.log(bubbleSort([64, 34, 25, 12, 22]));'
    ]
  },
  {
    id: 'sy-3',
    title: 'Factorial with Loop',
    language: 'python',
    code: [
      'def compute_factorial(num):',
      '    if num < 0:',
      '        return None',
      '    factorial = 1',
      '    for i in range(1, num + 1):',
      '        factorial *= i',
      '    return factorial',
      '',
      'result = compute_factorial(5)',
      'print("Factorial is:", result)'
    ]
  }
];

export const defaultChallengesTY = [
  {
    id: 'ty-1',
    title: 'Binary Search Implementation',
    language: 'python',
    code: [
      'def binary_search(arr, target):',
      '    low = 0',
      '    high = len(arr) - 1',
      '    while low <= high:',
      '        mid = (low + high) // 2',
      '        if arr[mid] == target:',
      '            return mid',
      '        elif arr[mid] < target:',
      '            low = mid + 1',
      '        else:',
      '            high = mid - 1',
      '    return -1',
      '',
      'items = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]',
      'index = binary_search(items, 23)',
      'print(f"Target found at index: {index}")'
    ]
  },
  {
    id: 'ty-2',
    title: 'Palindrome Validator (Two Pointer)',
    language: 'javascript',
    code: [
      'function isPalindrome(str) {',
      '  const clean = str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();',
      '  let start = 0;',
      '  let end = clean.length - 1;',
      '  while (start < end) {',
      '    if (clean[start] !== clean[end]) {',
      '      return false;',
      '    }',
      '    start++;',
      '    end--;',
      '  }',
      '  return true;',
      '}',
      'console.log(isPalindrome("A man, a plan, a canal: Panama"));'
    ]
  },
  {
    id: 'ty-3',
    title: 'Fibonacci Sequence Generator',
    language: 'python',
    code: [
      'def generate_fibonacci(limit):',
      '    fib_series = []',
      '    a, b = 0, 1',
      '    while a <= limit:',
      '        fib_series.append(a)',
      '        a, b = b, a + b',
      '    return fib_series',
      '',
      'output = generate_fibonacci(100)',
      'print("Fibonacci series up to 100:", output)'
    ]
  }
];
