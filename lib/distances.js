/*
  Levenstein implementation was initially found here
  https://gist.github.com/andrei-m/982927#gistcomment-1931258
*/
const distance = {
  hammer: (a, b) => {
    let dist = 0
    for (let i = 0; i < a.length; i++) {
      if (a[i] === b[i]) dist += 1
    }

    return dist
  },

  levenshtein: (a, b) => {
    if (a.length  === 0) return b.length
    if (b.length  === 0) return a.length
    
    let tmp, i, j, prev, val, row
    if (a.length > b.length) {
      tmp = a
      a = b
      b = tmp
    }

    row = Array(a.length + 1)

    for(i = 0; i <= a.length; i++) {
      row[i] = i
    }

    for (i = 1; i <= b.length; i++) {
      prev = i
      for (j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          val = row[j - 1] // match
        } else {
          val = Math.min(row[j -1] + 1, Math.min(prev + 1, row[j] + 1))
        }
        row[j - 1] = prev
        prev = val
      }
      row[a.length] = prev
    }
    return row[a.length]
  }
}

module.exports = distance
