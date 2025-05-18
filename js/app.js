document.addEventListener('DOMContentLoaded', () => {
  const donationForm = document.getElementById('donation-form')
  const donationFields = document.getElementById('donation-fields')
  const incomeFields = document.getElementById('income-fields')
  const addDonationBtn = document.getElementById('add-donation')
  const resultsContainer = document.getElementById('results')
  const resultsOutput = document.getElementById('results-output')

  const NUM_YEARS = 5
  const CURRENT_YEAR = new Date().getFullYear()

  function createDonationRow() {
    const wrapper = document.createElement('div')
    wrapper.className = 'flex space-x-2'

    wrapper.innerHTML = `
      <input type="number" placeholder="Amount (e.g., 500)" class="donation-amount p-2 border rounded w-1/2" />
      <select class="donation-year p-2 border rounded w-1/2">
        ${Array.from({ length: NUM_YEARS }, (_, i) => {
          const year = CURRENT_YEAR + i
          return `<option value="${year}">${year}</option>`
        }).join('')}
      </select>
    `

    donationFields.appendChild(wrapper)
  }

  function createIncomeFields() {
    for (let i = 0; i < NUM_YEARS; i++) {
      const year = CURRENT_YEAR + i
      const div = document.createElement('div')
      div.className = 'flex space-x-2 items-center'

      div.innerHTML = `
        <label class="w-20">${year}</label>
        <input type="number" class="income p-2 border rounded w-full" placeholder="Taxable income for ${year}" data-year="${year}" />
      `

      incomeFields.appendChild(div)
    }
  }

  function calculateCredits(donationsByYear, incomeByYear, province = 'ON') {
    const results = {}

    const federalRates = {
      threshold: 200,
      baseRate: 0.15,
      highRate: 0.29,
      topRate: 0.33,
      topThreshold: 235675,
    }

    const provincialRates = {
      ON: {
        baseRate: 0.0505,
        highRate: 0.1116,
        threshold: 200,
      },
      // Add other provinces here
    }

    for (let year in donationsByYear) {
      const income = incomeByYear[year] || 0
      const donations = donationsByYear[year].reduce((a, b) => a + b, 0)
      const isTopBracket = income >= federalRates.topThreshold

      let federalCredit = 0
      if (donations <= federalRates.threshold) {
        federalCredit = donations * federalRates.baseRate
      } else {
        federalCredit =
          federalRates.threshold * federalRates.baseRate +
          (donations - federalRates.threshold) *
            (isTopBracket ? federalRates.topRate : federalRates.highRate)
      }

      const provincial = provincialRates[province]
      let provincialCredit = 0
      if (donations <= provincial.threshold) {
        provincialCredit = donations * provincial.baseRate
      } else {
        provincialCredit =
          provincial.threshold * provincial.baseRate +
          (donations - provincial.threshold) * provincial.highRate
      }

      results[year] = {
        income,
        donations,
        federalCredit: federalCredit.toFixed(2),
        provincialCredit: provincialCredit.toFixed(2),
        totalCredit: (federalCredit + provincialCredit).toFixed(2),
      }
    }

    return results
  }

  function renderResults(results) {
    resultsOutput.innerHTML = ''

    for (let year in results) {
      const r = results[year]
      const div = document.createElement('div')
      div.className = 'p-4 bg-white shadow rounded'

      div.innerHTML = `
        <h3 class="text-lg font-semibold">${year}</h3>
        <p>Income: $${r.income.toLocaleString()}</p>
        <p>Total Donations Claimed: $${r.donations.toFixed(2)}</p>
        <p>Federal Credit: $${r.federalCredit}</p>
        <p>Provincial Credit: $${r.provincialCredit}</p>
        <p class="font-bold">Total Tax Credit: $${r.totalCredit}</p>
      `

      resultsOutput.appendChild(div)
    }

    resultsContainer.classList.remove('hidden')
  }

  donationForm.addEventListener('submit', e => {
    e.preventDefault()

    const incomeInputs = document.querySelectorAll('.income')
    const donationAmounts = document.querySelectorAll('.donation-amount')
    const donationYears = document.querySelectorAll('.donation-year')

    const incomeByYear = {}
    incomeInputs.forEach(input => {
      const year = input.dataset.year
      const value = parseFloat(input.value)
      if (!isNaN(value)) incomeByYear[year] = value
    })

    const donationsByYear = {}
    for (let i = 0; i < donationAmounts.length; i++) {
      const amt = parseFloat(donationAmounts[i].value)
      const yr = donationYears[i].value
      if (!isNaN(amt)) {
        if (!donationsByYear[yr]) donationsByYear[yr] = []
        donationsByYear[yr].push(amt)
      }
    }

    const province = document.getElementById('province').value
    const results = calculateCredits(donationsByYear, incomeByYear, province)
    renderResults(results)
  })

  addDonationBtn.addEventListener('click', () => {
    createDonationRow()
  })

  // Initialize
  createDonationRow()
  createIncomeFields()
})
