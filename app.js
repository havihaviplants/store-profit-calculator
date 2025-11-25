// 숫자 파싱 헬퍼
function parseNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

// 탭 전환
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

function showTab(name) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${name}`);
  });
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.tab;
    if (name) showTab(name);
  });
});

// 매출 → 고정비 버튼
document.getElementById("toFixed").addEventListener("click", () => {
  showTab("fixed");
});

// 고정비 → 변동비 버튼
document.getElementById("toVariable").addEventListener("click", () => {
  showTab("variable");
});

// 변동비 → 결과 버튼
document.getElementById("toResult").addEventListener("click", () => {
  calculateAndRender();
  showTab("result");
});

// "이전" 버튼들 (data-tab-jump)
document.querySelectorAll("[data-tab-jump]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tabJump;
    if (target) showTab(target);
  });
});

// Pass 버튼 처리
const passButtons = document.querySelectorAll(".pass-button");

passButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const groupKey = btn.dataset.passGroup;
    if (!groupKey) return;
    btn.classList.toggle("active");

    const body = document.querySelector(`.card-body[data-group="${groupKey}"]`);
    if (!body) return;
    body.classList.toggle("disabled");
  });
});

// 재료비 모드 토글 (비율 / 금액)
const ingredientsModeInputs = document.querySelectorAll(
  'input[name="ingredientsMode"]'
);

function updateIngredientsMode() {
  const selected = document.querySelector(
    'input[name="ingredientsMode"]:checked'
  )?.value;

  document
    .querySelectorAll('[data-ingredients-mode="percent"]')
    .forEach((el) => {
      el.classList.toggle("hidden", selected !== "percent");
    });

  document
    .querySelectorAll('[data-ingredients-mode="amount"]')
    .forEach((el) => {
      el.classList.toggle("hidden", selected !== "amount");
    });
}

ingredientsModeInputs.forEach((input) => {
  input.addEventListener("change", updateIngredientsMode);
});
updateIngredientsMode();

// 고정비/변동비 합계 대략 표시
function updateFixedSumDisplay() {
  const laborPass = document
    .querySelector('.pass-button[data-pass-group="labor"]')
    .classList.contains("active");
  const rentPass = document
    .querySelector('.pass-button[data-pass-group="rent"]')
    .classList.contains("active");
  const otherPass = document
    .querySelector('.pass-button[data-pass-group="fixedOther"]')
    .classList.contains("active");

  let sum = 0;

  if (!laborPass) {
    sum += parseNumber(document.getElementById("laborStaffInput").value);
    sum += parseNumber(document.getElementById("laborOwnerInput").value);
    sum += parseNumber(document.getElementById("socialInsuranceInput").value);
  }
  if (!rentPass) {
    sum += parseNumber(document.getElementById("rentInput").value);
    sum += parseNumber(document.getElementById("buildingMgmtInput").value);
  }
  if (!otherPass) {
    sum += parseNumber(document.getElementById("fixedOtherInput").value);
  }

  document.getElementById("fixedSumDisplay").textContent =
    sum.toLocaleString("ko-KR");
}

function updateVariableSumDisplay() {
  const sales = parseNumber(document.getElementById("salesInput").value);

  const ingPass = document
    .querySelector('.pass-button[data-pass-group="ingredients"]')
    .classList.contains("active");
  const delivPass = document
    .querySelector('.pass-button[data-pass-group="deliveryCommission"]')
    .classList.contains("active");
  const cardPass = document
    .querySelector('.pass-button[data-pass-group="cardFee"]')
    .classList.contains("active");
  const otherPass = document
    .querySelector('.pass-button[data-pass-group="variableOther"]')
    .classList.contains("active");

  let variable = 0;

  // 재료비
  if (!ingPass) {
    const mode = document.querySelector(
      'input[name="ingredientsMode"]:checked'
    )?.value;
    if (mode === "percent") {
      const rate = parseNumber(
        document.getElementById("ingredientsRateInput").value
      );
      variable += sales * (rate / 100);
    } else {
      variable += parseNumber(
        document.getElementById("ingredientsAmountInput").value
      );
    }
  }

  // 배달 수수료
  if (!delivPass) {
    const rate = parseNumber(
      document.getElementById("deliveryRateInput").value
    );
    variable += sales * (rate / 100);
  }

  // 카드 수수료
  if (!cardPass) {
    const rate = parseNumber(document.getElementById("cardRateInput").value);
    variable += sales * (rate / 100);
  }

  // 기타 변동비
  if (!otherPass) {
    variable += parseNumber(
      document.getElementById("variableOtherInput").value
    );
  }

  document.getElementById("variableSumDisplay").textContent =
    variable.toLocaleString("ko-KR");
}

// 입력 변화에 따라 합계 갱신
[
  "laborStaffInput",
  "laborOwnerInput",
  "socialInsuranceInput",
  "rentInput",
  "buildingMgmtInput",
  "fixedOtherInput",
].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener("input", updateFixedSumDisplay);
});

[
  "salesInput",
  "ingredientsRateInput",
  "ingredientsAmountInput",
  "deliveryRateInput",
  "cardRateInput",
  "variableOtherInput",
].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener("input", updateVariableSumDisplay);
});

ingredientsModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateVariableSumDisplay();
  });
});

// 메인 계산 로직
function calculateAndRender() {
  const sales = parseNumber(document.getElementById("salesInput").value);

  // --- 고정비 계산 ---
  const laborPass = document
    .querySelector('.pass-button[data-pass-group="labor"]')
    .classList.contains("active");
  const rentPass = document
    .querySelector('.pass-button[data-pass-group="rent"]')
    .classList.contains("active");
  const fixedOtherPass = document
    .querySelector('.pass-button[data-pass-group="fixedOther"]')
    .classList.contains("active");

  let laborStaff = 0;
  let laborOwner = 0;
  let socialInsurance = 0;
  let rent = 0;
  let buildingMgmt = 0;
  let fixedOther = 0;

  if (!laborPass) {
    laborStaff = parseNumber(
      document.getElementById("laborStaffInput").value
    );
    laborOwner = parseNumber(
      document.getElementById("laborOwnerInput").value
    );
    socialInsurance = parseNumber(
      document.getElementById("socialInsuranceInput").value
    );
  }

  if (!rentPass) {
    rent = parseNumber(document.getElementById("rentInput").value);
    buildingMgmt = parseNumber(
      document.getElementById("buildingMgmtInput").value
    );
  }

  if (!fixedOtherPass) {
    fixedOther = parseNumber(
      document.getElementById("fixedOtherInput").value
    );
  }

  const fixedCosts =
    laborStaff +
    laborOwner +
    socialInsurance +
    rent +
    buildingMgmt +
    fixedOther;

  // --- 변동비 계산 ---
  const ingPass = document
    .querySelector('.pass-button[data-pass-group="ingredients"]')
    .classList.contains("active");
  const delivPass = document
    .querySelector('.pass-button[data-pass-group="deliveryCommission"]')
    .classList.contains("active");
  const cardPass = document
    .querySelector('.pass-button[data-pass-group="cardFee"]')
    .classList.contains("active");
  const varOtherPass = document
    .querySelector('.pass-button[data-pass-group="variableOther"]')
    .classList.contains("active");

  let ingredients = 0;
  let deliveryCommission = 0;
  let cardFee = 0;
  let variableOther = 0;

  if (!ingPass) {
    const mode = document.querySelector(
      'input[name="ingredientsMode"]:checked'
    )?.value;
    if (mode === "percent") {
      const rate = parseNumber(
        document.getElementById("ingredientsRateInput").value
      );
      ingredients = sales * (rate / 100);
    } else {
      ingredients = parseNumber(
        document.getElementById("ingredientsAmountInput").value
      );
    }
  }

  if (!delivPass) {
    const rate = parseNumber(
      document.getElementById("deliveryRateInput").value
    );
    deliveryCommission = sales * (rate / 100);
  }

  if (!cardPass) {
    const rate = parseNumber(document.getElementById("cardRateInput").value);
    cardFee = sales * (rate / 100);
  }

  if (!varOtherPass) {
    variableOther = parseNumber(
      document.getElementById("variableOtherInput").value
    );
  }

  const variableCosts =
    ingredients + deliveryCommission + cardFee + variableOther;

  // --- 이익 계산 ---
  const grossProfit = sales - variableCosts;
  const operatingProfit = grossProfit - fixedCosts;

  // 사장 인건비 제외한 "사업 기준 순이익"
  const businessProfit = operatingProfit + laborOwner;

  // 사장 인건비 포함 후 최종 잔액
  const netProfitAfterOwner = operatingProfit;

  // 비율 및 손익분기점
  let netMargin = "-";
  let breakEvenSales = 0;
  let breakEvenCoverageText = "-";

  if (sales > 0) {
    const variableRatio = variableCosts / sales;
    const contributionMarginRatio = 1 - variableRatio;

    if (contributionMarginRatio > 0) {
      breakEvenSales = fixedCosts / contributionMarginRatio;
      const coverage =
        breakEvenSales > 0 ? sales / breakEvenSales : 0;
      breakEvenCoverageText = `${(coverage * 100).toFixed(1)}% (Current Revenue / Break-even Sales)`;
    }

    netMargin = `${((operatingProfit / sales) * 100).toFixed(1)}%`;
  }

  // --- 결과 렌더링 ---
  document.getElementById("resSales").textContent =
    sales.toLocaleString("ko-KR");
  document.getElementById("resVariable").textContent =
    variableCosts.toLocaleString("ko-KR");
  document.getElementById("resFixed").textContent =
    fixedCosts.toLocaleString("ko-KR");

  document.getElementById("resBusinessProfit").textContent =
    businessProfit.toLocaleString("ko-KR");
  document.getElementById("resNetAfterOwner").textContent =
    netProfitAfterOwner.toLocaleString("ko-KR");

  document.getElementById("resNetMargin").textContent = netMargin;

  document.getElementById("resBreakEvenSales").textContent =
    breakEvenSales > 0
      ? breakEvenSales.toLocaleString("ko-KR")
      : "-";
  document.getElementById("resBreakEvenCoverage").textContent =
    breakEvenCoverageText;
}

// 초기 합계 표시
updateFixedSumDisplay();
updateVariableSumDisplay();

const store = {
  sales: 0,
  fixed: {},
  variable: {}
};

