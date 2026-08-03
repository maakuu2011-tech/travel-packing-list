const root = document.querySelector("[data-planner]");

if (root) {
  const form = root.querySelector("[data-planner-form]");
  const emptyState = root.querySelector("[data-empty]");
  const resultContent = root.querySelector("[data-result-content]");
  const groupsElement = root.querySelector("[data-groups]");
  const countElement = root.querySelector("[data-result-count]");
  const summaryElement = root.querySelector("[data-trip-summary]");
  const progressLabel = root.querySelector("[data-progress-label]");
  const progressTrack = root.querySelector("[data-progress-track]");
  const progressBar = root.querySelector("[data-progress-bar]");
  const uncheckAllButton = root.querySelector("[data-uncheck-all]");
  const itemSearch = root.querySelector("[data-item-search]");
  const statusElement = root.querySelector("[data-status]");
  const customForm = root.querySelector("[data-custom-form]");
  const storageKey = "tabijitaku-list:v1";

  let currentItems = [];
  let checkedIds = new Set();
  let customItems = [];
  let currentFilter = "all";
  let currentConfig = {};

  const categoryOrder = [
    ["documents", "貴重品・手続き"],
    ["clothes", "衣類"],
    ["toiletries", "洗面・身だしなみ"],
    ["devices", "電子機器"],
    ["comfort", "移動・滞在"],
    ["special", "旅の条件に合わせて"],
    ["custom", "自分で追加したもの"],
  ];

  const item = (id, label, category, options = {}) => ({
    id,
    label,
    category,
    essential: false,
    quantity: "",
    note: "",
    ...options,
  });

  const readConfig = () => {
    const data = new FormData(form);
    return {
      tripType: data.get("tripType") || "domestic",
      destination: data.get("destination") || "standard",
      nights: Number(data.get("nights") || 0),
      season: data.get("season") || "spring",
      transport: data.get("transport") || "flight",
      styles: data.getAll("styles"),
    };
  };

  const getBaseItems = (config) => {
    const days = config.nights + 1;
    const overnight = config.nights > 0;
    const clothesCount = config.nights >= 7 ? "4〜5組（洗濯前提）" : `${days}組`;
    const bottomCount = config.nights >= 7 ? "3本前後" : `${Math.max(1, Math.ceil(days / 2))}本`;

    const items = [
      item("wallet", "財布・現金・決済用カード", "documents", {
        essential: true,
        note: "普段使うものと予備を分けると安心",
      }),
      item("phone", "スマートフォン", "documents", { essential: true }),
      item("identity", "身分証明書", "documents", {
        essential: true,
        note: "運転する場合は免許証も確認",
      }),
      item("booking", "予約情報・乗車券", "documents", {
        essential: true,
        note: "オフラインでも見られる状態にする",
      }),
      item("medicine", "常備薬・処方薬", "documents", {
        essential: true,
        note: "必要日数より少し余裕を持たせる",
      }),
      item("charger", "スマートフォン充電器", "devices", { essential: true }),
      item("power-bank", "モバイルバッテリー", "devices", {
        note: "飛行機では預けず手荷物へ",
      }),
      item("earphones", "イヤホン", "devices"),
      item("handkerchief", "ハンカチ・ティッシュ", "comfort"),
      item("drink", "飲み物", "comfort", {
        note: config.transport === "flight" ? "保安検査後に用意" : "",
      }),
      item("bag", "小さな外出用バッグ", "comfort"),
    ];

    if (overnight) {
      items.push(
        item("tops", "トップス", "clothes", { quantity: clothesCount }),
        item("bottoms", "ボトムス", "clothes", { quantity: bottomCount }),
        item("underwear", "下着", "clothes", { quantity: `${days}組`, essential: true }),
        item("socks", "靴下", "clothes", { quantity: `${days}組` }),
        item("sleepwear", "寝巻き", "clothes", { quantity: "1組" }),
        item("toothbrush", "歯ブラシ・歯みがき用品", "toiletries"),
        item("skincare", "洗顔・スキンケア用品", "toiletries"),
        item("hair", "ヘアケア用品", "toiletries"),
        item("contact", "眼鏡・コンタクト用品", "toiletries"),
        item("laundry-bag", "使用済み衣類を分ける袋", "comfort"),
      );
    }

    return items;
  };

  const addConditionalItems = (items, config) => {
    const isInternational = config.tripType === "international";

    if (isInternational) {
      items.push(
        item("passport", "パスポート", "documents", { essential: true }),
        item("entry-docs", "入国に必要な書類・登録", "documents", {
          essential: true,
          note: "渡航先の最新条件を公式情報で確認",
        }),
        item("insurance", "海外旅行保険の情報", "documents"),
        item("passport-copy", "パスポートの控え", "documents"),
        item("esim", "通信手段（eSIM・SIM・Wi-Fi）", "devices", {
          essential: true,
          note: "出発前に開通手順を保存",
        }),
        item("adapter", "変換プラグ", "devices", {
          note: "渡航先のコンセント形状を確認",
        }),
        item("translation", "翻訳・地図アプリのオフライン設定", "devices"),
      );
    }

    if (config.destination === "beach") {
      items.push(
        item("swimwear", "水着", "special", { quantity: "1〜2着" }),
        item("sunscreen", "日焼け止め", "special", { essential: true }),
        item("hat", "帽子", "special"),
        item("sandals", "サンダル", "special"),
        item("waterproof-case", "防水ポーチ", "special"),
      );
    }

    if (config.destination === "eastAsia") {
      items.push(
        item("local-payment", "現地で使える決済手段", "special", {
          note: "カードと少額の現金を分けて準備",
        }),
        item("address-note", "宿泊先住所の控え", "special", {
          essential: isInternational,
          note: "現地語表記も保存",
        }),
      );
    }

    if (config.destination === "longHaul") {
      items.push(
        item("neck-pillow", "ネックピロー", "comfort"),
        item("compression-socks", "着圧ソックス", "comfort"),
        item("eye-mask", "アイマスク", "comfort"),
        item("time-zone-medicine", "服薬時間のメモ", "documents"),
      );
    }

    if (config.destination === "cold" || config.season === "winter") {
      items.push(
        item("warm-outer", "防寒アウター", "clothes", { essential: true }),
        item("thermal", "保温インナー", "clothes", { quantity: "1〜2組" }),
        item("gloves", "手袋・マフラー", "special"),
        item("lip-balm", "リップクリーム・保湿用品", "toiletries"),
      );
    }

    if (config.season === "summer") {
      items.push(
        item("cooling", "汗拭きシート・冷却用品", "special"),
        item("insect", "虫よけ", "special"),
        item("summer-hat", "日よけ用の帽子", "special"),
      );
    }

    if (config.season === "rainy") {
      items.push(
        item("umbrella", "折りたたみ傘", "special", { essential: true }),
        item("rain-cover", "バッグ用の防水袋", "special"),
        item("spare-socks", "替えの靴下", "clothes", { quantity: "1組追加" }),
      );
    }

    if (config.transport === "flight") {
      items.push(
        item("liquid-bag", "機内持ち込み用の液体袋", "comfort", {
          note: isInternational ? "容量制限を航空会社で確認" : "",
        }),
        item("flight-layer", "機内の冷え対策", "comfort"),
      );
    }

    if (config.transport === "train") {
      items.push(
        item("station-ticket", "乗車用ICカード・切符", "documents", { essential: true }),
        item("compact-snack", "移動中の軽食", "comfort"),
      );
    }

    if (config.transport === "car") {
      items.push(
        item("car-key", "車のキー", "documents", { essential: true }),
        item("etc", "ETCカード", "documents"),
        item("car-charger", "車載充電器", "devices"),
        item("driver-glasses", "運転用眼鏡・サングラス", "comfort"),
      );
    }

    if (config.styles.includes("family")) {
      items.push(
        item("child-id", "子どもの保険証・医療情報", "documents", { essential: true }),
        item("child-clothes", "子どもの着替え", "clothes", {
          quantity: `${config.nights + 2}組`,
          note: "予定より1組多め",
        }),
        item("child-medicine", "子ども用の薬・体温計", "special"),
        item("child-snacks", "食べ慣れたおやつ・飲み物", "special"),
        item("child-comfort", "移動中のおもちゃ・絵本", "special"),
        item("stroller", "抱っこひも・ベビーカー", "special"),
      );
    }

    if (config.styles.includes("business")) {
      items.push(
        item("laptop", "仕事用パソコン", "devices", { essential: true }),
        item("laptop-charger", "パソコン用充電器", "devices", { essential: true }),
        item("work-docs", "仕事の資料・入館情報", "documents", { essential: true }),
        item("business-cards", "名刺", "documents"),
        item("work-clothes", "仕事用の服・靴", "clothes"),
      );
    }

    if (config.styles.includes("formal")) {
      items.push(
        item("formal-wear", "式・会食用の服", "clothes", { essential: true }),
        item("formal-shoes", "場に合う靴", "clothes"),
        item("grooming", "身だしなみ用品", "toiletries"),
      );
    }

    if (config.styles.includes("outdoor")) {
      items.push(
        item("outdoor-shoes", "歩きやすい靴", "special", { essential: true }),
        item("outdoor-layer", "脱ぎ着しやすい上着", "clothes"),
        item("outdoor-towel", "タオル", "special"),
        item("outdoor-bag", "ごみ・濡れ物用の袋", "special"),
      );
    }

    if (config.styles.includes("onsen")) {
      items.push(
        item("onsen-pouch", "浴場へ持っていく小さな袋", "special"),
        item("hair-band", "ヘアゴム・ヘアバンド", "toiletries"),
        item("after-bath", "入浴後のスキンケア", "toiletries"),
      );
    }
  };

  const uniqueItems = (items) => {
    const seen = new Set();
    return items.filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  };

  const buildItems = (config) => {
    const items = getBaseItems(config);
    addConditionalItems(items, config);
    customItems.forEach((custom) => {
      items.push(item(custom.id, custom.label, "custom"));
    });
    return uniqueItems(items);
  };

  const configLabels = {
    domestic: "国内",
    international: "海外",
    standard: "都市",
    beach: "海辺・常夏",
    eastAsia: "東アジア",
    longHaul: "長距離",
    cold: "寒冷地",
  };

  const getTripSummary = (config) => {
    const dayLabel = config.nights === 0 ? "日帰り" : `${config.nights}泊${config.nights + 1}日`;
    return `${configLabels[config.tripType]}・${configLabels[config.destination]}・${dayLabel}`;
  };

  const createItemElement = (entry) => {
    const row = document.createElement("label");
    row.className = "packing-item";
    row.dataset.itemId = entry.id;
    row.dataset.essential = String(entry.essential);
    row.dataset.searchText = `${entry.label} ${entry.note}`.toLowerCase();

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checkedIds.has(entry.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) checkedIds.add(entry.id);
      else checkedIds.delete(entry.id);
      persist();
      updateProgress();
      applyFilters();
    });

    const marker = document.createElement("span");
    marker.className = "packing-item__check";

    const copy = document.createElement("span");
    copy.className = "packing-item__copy";

    const line = document.createElement("span");
    line.className = "packing-item__line";

    const name = document.createElement("strong");
    name.textContent = entry.label;
    line.appendChild(name);

    if (entry.quantity) {
      const quantity = document.createElement("span");
      quantity.className = "quantity-badge";
      quantity.textContent = entry.quantity;
      line.appendChild(quantity);
    }

    if (entry.essential) {
      const essential = document.createElement("span");
      essential.className = "essential-badge";
      essential.textContent = "必須";
      line.appendChild(essential);
    }

    copy.appendChild(line);

    if (entry.note) {
      const note = document.createElement("small");
      note.textContent = entry.note;
      copy.appendChild(note);
    }

    row.append(checkbox, marker, copy);
    return row;
  };

  const render = () => {
    groupsElement.replaceChildren();

    categoryOrder.forEach(([categoryId, heading]) => {
      const entries = currentItems.filter((entry) => entry.category === categoryId);
      if (!entries.length) return;

      const section = document.createElement("section");
      section.className = "packing-group";
      section.dataset.group = categoryId;

      const title = document.createElement("h4");
      title.textContent = heading;
      section.appendChild(title);

      const list = document.createElement("div");
      list.className = "packing-list";
      entries.forEach((entry) => list.appendChild(createItemElement(entry)));
      section.appendChild(list);
      groupsElement.appendChild(section);
    });

    countElement.textContent = `${currentItems.length}点`;
    summaryElement.textContent = getTripSummary(currentConfig);
    emptyState.hidden = true;
    resultContent.hidden = false;
    updateProgress();
    applyFilters();
  };

  const updateProgress = () => {
    const visibleIds = currentItems.map((entry) => entry.id);
    const checkedCount = visibleIds.filter((id) => checkedIds.has(id)).length;
    const total = currentItems.length;
    const percent = total ? Math.round((checkedCount / total) * 100) : 0;
    progressLabel.textContent = `${checkedCount} / ${total}`;
    progressTrack.setAttribute("aria-valuemax", String(total));
    progressTrack.setAttribute("aria-valuenow", String(checkedCount));
    progressTrack.setAttribute("aria-valuetext", `${total}点中${checkedCount}点準備済み`);
    progressBar.style.width = `${percent}%`;
    uncheckAllButton.disabled = checkedCount === 0;
  };

  const applyFilters = () => {
    const query = itemSearch.value.trim().toLowerCase();
    groupsElement.querySelectorAll(".packing-item").forEach((element) => {
      const isChecked = checkedIds.has(element.dataset.itemId);
      const isEssential = element.dataset.essential === "true";
      const matchesFilter =
        currentFilter === "all" ||
        (currentFilter === "open" && !isChecked) ||
        (currentFilter === "essential" && isEssential);
      const matchesQuery = !query || element.dataset.searchText.includes(query);
      element.hidden = !(matchesFilter && matchesQuery);
    });

    groupsElement.querySelectorAll(".packing-group").forEach((group) => {
      const hasVisibleItems = [...group.querySelectorAll(".packing-item")].some((entry) => !entry.hidden);
      group.hidden = !hasVisibleItems;
    });
  };

  const persist = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          config: currentConfig,
          checkedIds: [...checkedIds],
          customItems,
        }),
      );
    } catch {
      // Private browsing or storage restrictions should not block the planner.
    }
  };

  const applyConfigToForm = (config) => {
    if (!config) return;

    ["tripType", "destination", "nights", "season", "transport"].forEach((name) => {
      const value = String(config[name] ?? "");
      const input = form.querySelector(`[name="${name}"][value="${CSS.escape(value)}"]`);
      if (input) input.checked = true;
      const select = form.querySelector(`select[name="${name}"]`);
      if (select && [...select.options].some((option) => option.value === value)) {
        select.value = value;
      }
    });

    form.querySelectorAll('[name="styles"]').forEach((checkbox) => {
      checkbox.checked = config.styles?.includes(checkbox.value) || false;
    });
  };

  const readQueryConfig = () => {
    const params = new URLSearchParams(window.location.search);
    if (![...params.keys()].length) return null;
    return {
      tripType: params.get("trip") || undefined,
      destination: params.get("destination") || undefined,
      nights: params.get("nights") || undefined,
      season: params.get("season") || undefined,
      transport: params.get("transport") || undefined,
      styles: params.get("styles")?.split(",").filter(Boolean) || [],
    };
  };

  const restore = () => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey));
    } catch {
      saved = null;
    }

    if (saved?.checkedIds) checkedIds = new Set(saved.checkedIds);
    if (saved?.customItems) customItems = saved.customItems;

    const queryConfig = readQueryConfig();
    const mergedConfig = {
      ...(saved?.config || {}),
      ...(queryConfig || {}),
    };
    applyConfigToForm(mergedConfig);
  };

  const generate = ({ updateUrl = true } = {}) => {
    currentConfig = readConfig();
    currentItems = buildItems(currentConfig);
    render();
    persist();

    if (updateUrl) {
      const params = new URLSearchParams({
        trip: currentConfig.tripType,
        destination: currentConfig.destination,
        nights: String(currentConfig.nights),
        season: currentConfig.season,
        transport: currentConfig.transport,
      });
      if (currentConfig.styles.length) params.set("styles", currentConfig.styles.join(","));
      history.replaceState({}, "", `${window.location.pathname}?${params}`);
    }
  };

  const setStatus = (message) => {
    statusElement.textContent = message;
    window.clearTimeout(setStatus.timeout);
    setStatus.timeout = window.setTimeout(() => {
      statusElement.textContent = "";
    }, 3200);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generate();
    root.querySelector("[data-result]")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    form.reset();
    checkedIds = new Set();
    customItems = [];
    itemSearch.value = "";
    currentFilter = "all";
    root.querySelectorAll("[data-filter]").forEach((button) => {
      const isActive = button.dataset.filter === "all";
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage restrictions.
    }
    generate();
    setStatus("初期状態に戻しました");
  });

  root.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      root.querySelectorAll("[data-filter]").forEach((entry) => {
        const isActive = entry === button;
        entry.classList.toggle("is-active", isActive);
        entry.setAttribute("aria-pressed", String(isActive));
      });
      applyFilters();
    });
  });

  itemSearch.addEventListener("input", applyFilters);

  uncheckAllButton.addEventListener("click", () => {
    checkedIds.clear();
    persist();
    render();
    setStatus("すべて未準備に戻しました");
  });

  customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = customForm.elements.customItem;
    const label = input.value.trim();
    if (!label) return;
    customItems.push({
      id: `custom-${Date.now()}`,
      label,
    });
    input.value = "";
    currentItems = buildItems(currentConfig);
    render();
    persist();
    setStatus("持ち物を追加しました");
  });

  root.querySelector("[data-copy]")?.addEventListener("click", async () => {
    const lines = [`【${getTripSummary(currentConfig)}の持ち物】`];
    categoryOrder.forEach(([categoryId, heading]) => {
      const entries = currentItems.filter((entry) => entry.category === categoryId);
      if (!entries.length) return;
      lines.push("", `■ ${heading}`);
      entries.forEach((entry) => {
        const mark = checkedIds.has(entry.id) ? "✓" : "□";
        const quantity = entry.quantity ? `（${entry.quantity}）` : "";
        lines.push(`${mark} ${entry.label}${quantity}`);
      });
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("持ち物リストをコピーしました");
    } catch {
      setStatus("コピーできませんでした");
    }
  });

  root.querySelector("[data-print]")?.addEventListener("click", () => window.print());

  root.querySelector("[data-share]")?.addEventListener("click", async () => {
    const shareData = {
      title: "旅じたくリスト",
      text: `${getTripSummary(currentConfig)}の持ち物リスト`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setStatus("共有用URLをコピーしました");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setStatus("共有できませんでした");
    }
  });

  restore();
  generate({ updateUrl: false });
}
