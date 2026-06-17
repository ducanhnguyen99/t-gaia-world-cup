// Chained arithmetic questions: 5–7 operations, numbers 1–9, +/-/×, no
// parentheses, order of operations respected, result a positive integer.

export interface MathQuestion {
  display: string
  answer: number
}

const OPS = ['+', '-', '×'] as const

function evaluate(nums: number[], ops: string[]): number {
  // First pass: multiplication.
  const reduced: number[] = [nums[0]]
  const addOps: string[] = []
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === '×') {
      reduced[reduced.length - 1] *= nums[i + 1]
    } else {
      addOps.push(ops[i])
      reduced.push(nums[i + 1])
    }
  }
  // Second pass: addition / subtraction left to right.
  let result = reduced[0]
  for (let i = 0; i < addOps.length; i++) {
    result = addOps[i] === '+' ? result + reduced[i + 1] : result - reduced[i + 1]
  }
  return result
}

/** Generate one valid question (positive integer answer). */
export function generateMathQuestion(): MathQuestion {
  for (let attempt = 0; attempt < 200; attempt++) {
    const count = 3 + Math.floor(Math.random() * 2) // 3–4 operations
    const nums = Array.from({ length: count + 1 }, () =>
      Math.floor(Math.random() * 9) + 1,
    )
    // At most one × in the whole expression (and never chained), so it stays
    // quick mental maths rather than a multiplication marathon.
    let usedMultiply = false
    const ops = Array.from({ length: count }, () => {
      const allowMultiply = !usedMultiply && Math.random() < 0.5
      const op = allowMultiply
        ? OPS[Math.floor(Math.random() * OPS.length)]
        : (['+', '-'] as const)[Math.floor(Math.random() * 2)]
      if (op === '×') usedMultiply = true
      return op
    })
    const answer = evaluate(nums, ops)
    if (answer > 0 && Number.isInteger(answer)) {
      const display = nums
        .map((n, i) => (i === 0 ? `${n}` : `${ops[i - 1]} ${n}`))
        .join(' ')
      return { display, answer }
    }
  }
  // Fallback (extremely unlikely to be hit).
  return { display: '1 + 1', answer: 2 }
}
