(function () {
  "use strict";

  var STORAGE_KEY = "stm32NavigatorStateV1";
  var VALID_LOOPS = ["preview", "practice"];
  var VALID_STATUSES = ["not_started", "learning", "review", "blocked", "passed"];
  var STATUS_LABELS = {
    not_started: "未开始",
    learning: "学习中",
    review: "待复习",
    blocked: "阻塞",
    passed: "已通过"
  };
  var LOOP_LABELS = {
    preview: "第一循环 · 认知预习",
    practice: "第二循环 · 动手实操"
  };
  var REVIEW_FIELDS = [
    "goal", "equipment", "wiring", "changes", "expected", "actual",
    "problems", "cause", "solution", "redo", "next"
  ];
  var curriculum = window.CURRICULUM;
  var builtInNodes = curriculum && Array.isArray(curriculum.nodes) ? curriculum.nodes.slice().sort(byOrder) : [];
  var nodes = [];
  var state = loadState();
  var currentView = "home";
  var noteTimer = null;
  var reviewTimer = null;
  var toastTimer = null;
  var importUndoSnapshot = null;

  var elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();

    refreshNodes();
    if (!curriculum || curriculum.schemaVersion !== 1 || !nodes.length) {
      showFatalMessage("课程导航数据无法读取。请检查 curriculum.js 是否在 app.js 之前加载。");
      return;
    }

    if (!findNode(state.currentNodeId)) {
      state.currentNodeId = nodes[0].id;
    }

    if (unlockCompletedMilestones().length) saveState();
    renderAll();
  }

  function cacheElements() {
    [
      "save-label", "home-view", "tree-view", "manage-view", "progress-view", "learning-view", "loop-badge",
      "status-badge", "breadcrumb", "home-title", "recommendation-reason",
      "home-objective", "next-task-label", "continue-button", "loop-progress",
      "loop-progress-bar", "recent-note", "last-saved", "tree-container",
      "back-button", "learning-breadcrumb", "learning-title", "importance-tag",
      "type-tag", "loop-notice", "learning-objective", "learning-reason",
      "dependency-map", "resources-list", "tasks-list", "checks-list",
      "note-input", "gate-message", "pass-button", "block-editor",
      "block-reason", "save-block-button", "clear-block-button",
      "previous-node", "next-node", "toast", "status-filter", "filter-result",
      "custom-node-form", "custom-node-id", "custom-title", "custom-module",
      "custom-type", "custom-importance", "custom-order", "custom-objective",
      "custom-prerequisites", "custom-preview-tasks", "custom-preview-checks",
      "custom-practice-tasks", "custom-practice-checks", "cancel-node-edit",
      "custom-node-list", "personal-resource-form", "resource-node",
      "resource-title", "resource-url", "resource-scope", "resource-focus",
      "resource-stop", "personal-resource-list", "loop-progress-cards",
      "scope-progress-list", "milestone-list", "experiment-review-list",
      "export-data", "choose-import", "import-file", "undo-import",
      "restore-built-in", "clear-personal-data", "import-summary",
      "experiment-review-section", "review-goal", "review-equipment",
      "review-wiring", "review-changes", "review-expected", "review-actual",
      "review-problems", "review-cause", "review-solution", "review-redo", "review-next"
    ].forEach(function (id) {
      elements[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    document.querySelectorAll(".nav-button").forEach(function (button) {
      button.addEventListener("click", function () {
        showView(button.dataset.view);
      });
    });

    document.querySelectorAll("[data-go-tree]").forEach(function (button) {
      button.addEventListener("click", function () { showView("tree"); });
    });

    elements["continue-button"].addEventListener("click", function () {
      openNode(getRecommendation().node.id);
    });
    elements["back-button"].addEventListener("click", function () { showView("home"); });

    document.querySelectorAll("[data-loop]").forEach(function (button) {
      button.addEventListener("click", function () {
        switchLoop(button.dataset.loop);
      });
    });

    elements["note-input"].addEventListener("input", function () {
      clearTimeout(noteTimer);
      markSaving();
      noteTimer = setTimeout(saveNote, 500);
    });

    document.querySelectorAll("[data-status]").forEach(function (button) {
      button.addEventListener("click", function () {
        setStatus(button.dataset.status);
      });
    });

    elements["pass-button"].addEventListener("click", attemptPass);
    elements["save-block-button"].addEventListener("click", saveBlockReason);
    elements["clear-block-button"].addEventListener("click", clearBlock);
    elements["previous-node"].addEventListener("click", function () { moveNode(-1); });
    elements["next-node"].addEventListener("click", function () { moveNode(1); });
    elements["status-filter"].addEventListener("change", renderTree);
    elements["custom-node-form"].addEventListener("submit", saveCustomNode);
    elements["cancel-node-edit"].addEventListener("click", resetCustomNodeForm);
    elements["personal-resource-form"].addEventListener("submit", savePersonalResource);
    elements["export-data"].addEventListener("click", exportData);
    elements["choose-import"].addEventListener("click", function () { elements["import-file"].click(); });
    elements["import-file"].addEventListener("change", importData);
    elements["undo-import"].addEventListener("click", undoImport);
    elements["restore-built-in"].addEventListener("click", restoreBuiltInRoute);
    elements["clear-personal-data"].addEventListener("click", clearPersonalData);
    REVIEW_FIELDS.forEach(function (field) {
      elements["review-" + field].addEventListener("input", scheduleReviewSave);
    });

    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) {
        mergeExternalState();
      }
    });
  }

  function createDefaultState() {
    return {
      schemaVersion: 1,
      currentLoop: "preview",
      currentNodeId: nodes.length ? nodes[0].id : "route-overview",
      updatedAt: "",
      records: {},
      customNodes: [],
      customResources: {},
      unlockedMilestones: []
    };
  }

  function loadState() {
    var fallback = createDefaultState();
    var raw;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;

      var parsed = JSON.parse(raw);
      if (!parsed || parsed.schemaVersion !== 1) {
        setTimeout(function () {
          showToast("本地记录版本无法识别，已安全使用空白视图；原数据没有被覆盖。");
        }, 0);
        return fallback;
      }

      fallback.currentLoop = VALID_LOOPS.indexOf(parsed.currentLoop) >= 0 ? parsed.currentLoop : "preview";
      fallback.currentNodeId = typeof parsed.currentNodeId === "string" ? parsed.currentNodeId : fallback.currentNodeId;
      fallback.updatedAt = typeof parsed.updatedAt === "string" ? parsed.updatedAt : "";
      fallback.customNodes = sanitizeCustomNodes(parsed.customNodes);
      fallback.customResources = sanitizeCustomResources(parsed.customResources, fallback.customNodes);
      fallback.records = sanitizeRecords(parsed.records);
      fallback.unlockedMilestones = Array.isArray(parsed.unlockedMilestones)
        ? parsed.unlockedMilestones.filter(function (id) { return typeof id === "string"; })
        : [];
      return fallback;
    } catch (error) {
      setTimeout(function () {
        showToast("本地记录解析失败，已安全使用空白视图；损坏数据没有被覆盖。");
      }, 0);
      return fallback;
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderSaveTime();
    } catch (error) {
      elements["save-label"].textContent = "保存失败，请检查浏览器存储";
      showToast("学习记录保存失败，请先不要关闭页面。");
    }
  }

  function getRecord(nodeId, loop) {
    if (!state.records[nodeId] || typeof state.records[nodeId] !== "object") {
      state.records[nodeId] = {};
    }
    if (!state.records[nodeId][loop] || typeof state.records[nodeId][loop] !== "object") {
      state.records[nodeId][loop] = defaultRecord();
    }

    var record = state.records[nodeId][loop];
    record.status = VALID_STATUSES.indexOf(record.status) >= 0 ? record.status : "not_started";
    record.completedTaskIds = Array.isArray(record.completedTaskIds) ? record.completedTaskIds : [];
    record.passedCheckIds = Array.isArray(record.passedCheckIds) ? record.passedCheckIds : [];
    record.note = typeof record.note === "string" ? record.note : "";
    record.blockReason = typeof record.blockReason === "string" ? record.blockReason : "";
    record.experimentReview = sanitizeExperimentReview(record.experimentReview);
    return record;
  }

  function defaultRecord() {
    return {
      status: "not_started",
      completedTaskIds: [],
      passedCheckIds: [],
      checkAnswers: {},
      note: "",
      blockReason: "",
      experimentReview: {}
    };
  }

  function renderAll() {
    refreshNodes();
    if (!findNode(state.currentNodeId) && nodes.length) {
      state.currentNodeId = findNode("route-overview") ? "route-overview" : nodes[0].id;
    }
    renderHome();
    renderTree();
    renderManage();
    renderProgress();
    if (currentView === "learning") renderLearning();
    renderSaveTime();
  }

  function renderHome() {
    var recommendation = getRecommendation();
    var node = recommendation.node;
    var record = getRecord(node.id, state.currentLoop);
    var stage = findStage(node.stageId);
    var module = findModule(node.moduleId);
    var nextTask = getNextTask(node, record);
    var progress = calculateLoopProgress(state.currentLoop);

    elements["loop-badge"].textContent = LOOP_LABELS[state.currentLoop];
    setStatusBadge(elements["status-badge"], record.status);
    elements["breadcrumb"].textContent = [stage.title, module.title].join(" → ");
    elements["home-title"].textContent = node.title;
    elements["recommendation-reason"].textContent = recommendation.reason;
    elements["home-objective"].textContent = getObjective(node, state.currentLoop);
    elements["next-task-label"].textContent = nextTask || (record.status === "passed" ? "本节点已通过，查看下一项推荐" : "完成自我验收并确认通过");
    elements["continue-button"].textContent = record.status === "not_started" ? "开始学习" : "继续学习";
    elements["loop-progress"].textContent = progress.passed + " / " + progress.total + " 个核心节点";
    elements["loop-progress-bar"].style.width = progress.percent + "%";
    elements["recent-note"].textContent = findRecentNote() || "还没有笔记。学习卡中的笔记会自动保存。";
  }

  function renderTree() {
    elements["tree-container"].replaceChildren();
    var statusFilter = elements["status-filter"].value;
    var visibleCount = 0;

    curriculum.stages.slice().sort(byOrder).forEach(function (stage) {
      var stageVisible = false;
      var stageDetails = document.createElement("details");
      stageDetails.className = "tree-stage";
      stageDetails.open = true;
      var stageSummary = document.createElement("summary");
      stageSummary.textContent = stage.title;
      stageDetails.appendChild(stageSummary);

      curriculum.modules.filter(function (module) {
        return module.stageId === stage.id;
      }).sort(byOrder).forEach(function (module) {
        var allModuleNodes = nodes.filter(function (node) { return node.moduleId === module.id; });
        var moduleNodes = allModuleNodes.filter(function (node) {
          return statusFilter === "all" || getRecord(node.id, state.currentLoop).status === statusFilter;
        });
        if (!moduleNodes.length) return;
        stageVisible = true;
        visibleCount += moduleNodes.length;
        var passed = allModuleNodes.filter(function (node) {
          return node.importance === "core" && getRecord(node.id, state.currentLoop).status === "passed";
        }).length;
        var total = allModuleNodes.filter(function (node) { return node.importance === "core"; }).length;

        var moduleDetails = document.createElement("details");
        moduleDetails.className = "tree-module";
        moduleDetails.open = true;
        var moduleSummary = document.createElement("summary");
        moduleSummary.append(textSpan(module.title));
        moduleSummary.append(textSpan(passed + " / " + total + " 核心已通过"));
        moduleDetails.appendChild(moduleSummary);

        var nodeList = document.createElement("div");
        nodeList.className = "tree-nodes";
        moduleNodes.forEach(function (node) {
          var record = getRecord(node.id, state.currentLoop);
          var button = document.createElement("button");
          button.type = "button";
          button.className = "tree-node";
          button.append(textSpan(node.title));
          button.append(textSmall((node.importance === "core" ? "核心" : "选学") + " · " + (node.type === "experiment" ? "实验" : "理论") + (node.custom ? " · 自定义" : "")));
          var status = textSpan(STATUS_LABELS[record.status]);
          status.className = "tree-status";
          button.append(status);
          button.addEventListener("click", function () { openNode(node.id); });
          nodeList.appendChild(button);
        });
        moduleDetails.appendChild(nodeList);
        stageDetails.appendChild(moduleDetails);
      });
      if (stageVisible) elements["tree-container"].appendChild(stageDetails);
    });
    elements["filter-result"].textContent = "显示 " + visibleCount + " 个知识点";
    if (!visibleCount) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "当前筛选条件下没有知识点。";
      elements["tree-container"].appendChild(empty);
    }
  }

  function renderLearning() {
    var node = findNode(state.currentNodeId);
    if (!node) return;
    var stage = findStage(node.stageId);
    var module = findModule(node.moduleId);
    var record = getRecord(node.id, state.currentLoop);
    var nodeIndex = nodes.findIndex(function (item) { return item.id === node.id; });

    elements["learning-breadcrumb"].textContent = [stage.title, module.title].join(" → ");
    elements["learning-title"].textContent = node.title;
    elements["importance-tag"].textContent = node.importance === "core" ? "核心" : "选学";
    elements["type-tag"].textContent = node.type === "experiment" ? "实验" : "理论";
    elements["learning-objective"].textContent = getObjective(node, state.currentLoop);
    elements["learning-reason"].textContent = getReasonForNode(node);
    elements["note-input"].value = record.note;
    elements["block-reason"].value = record.blockReason;
    elements["block-editor"].hidden = record.status !== "blocked";

    document.querySelectorAll("[data-loop]").forEach(function (button) {
      var active = button.dataset.loop === state.currentLoop;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    var previewComplete = calculateLoopProgress("preview").percent === 100;
    elements["loop-notice"].hidden = state.currentLoop !== "practice" || previewComplete;
    elements["loop-notice"].textContent = "第一循环核心路线尚未全部通过。你已主动提前进入实操循环；实操推荐仍会检查本节点的第一循环状态。";

    renderDependencies(node);
    renderResources(node);
    renderChecklist(node, record, "tasks");
    renderChecklist(node, record, "checks");
    renderExperimentReview(node, record);
    renderGate(node, record);

    elements["previous-node"].disabled = nodeIndex <= 0;
    elements["next-node"].disabled = nodeIndex < 0 || nodeIndex >= nodes.length - 1;
  }

  function renderDependencies(node) {
    var prerequisites = node.prerequisites.map(findNode).filter(Boolean);
    var following = nodes.filter(function (candidate) {
      return candidate.prerequisites.indexOf(node.id) >= 0;
    });
    var container = elements["dependency-map"];
    container.replaceChildren();

    container.appendChild(dependencyGroup("直接前置", prerequisites, false));
    container.appendChild(arrow());

    var current = document.createElement("div");
    current.className = "dependency-group current";
    current.append(textSmall("当前知识点"));
    var currentTitle = document.createElement("strong");
    currentTitle.textContent = node.title;
    current.append(currentTitle);
    container.appendChild(current);

    container.appendChild(arrow());
    container.appendChild(dependencyGroup("直接后续", following, true));
  }

  function dependencyGroup(label, items, isFollowing) {
    var group = document.createElement("div");
    group.className = "dependency-group";
    var heading = textSmall(label);
    heading.className = "dependency-label";
    group.appendChild(heading);

    if (!items.length) {
      var empty = textSpan("无");
      empty.className = "empty";
      group.appendChild(empty);
      return group;
    }

    items.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "dependency-link";
      button.textContent = item.title;
      if (!isFollowing && !isPrerequisitePassed(item.id, state.currentLoop)) {
        var warning = document.createElement("span");
        warning.textContent = " · 当前循环未通过";
        button.appendChild(warning);
      }
      button.addEventListener("click", function () { openNode(item.id); });
      group.appendChild(button);
    });
    return group;
  }

  function renderResources(node) {
    var container = elements["resources-list"];
    var resources = getResourcesForNode(node);
    container.replaceChildren();
    if (!resources.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "当前节点暂无可靠外部链接。";
      container.appendChild(empty);
      return;
    }

    resources.forEach(function (resource) {
      var card = document.createElement("article");
      card.className = "resource-card";
      var titleRow = document.createElement("div");
      titleRow.className = "resource-title";
      var link = document.createElement("a");
      link.href = resource.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = resource.title + " ↗";
      titleRow.appendChild(link);
      if (resource.primary) titleRow.appendChild(textSmall("主要资源"));
      if (resource.personal) titleRow.appendChild(textSmall("个人资源"));
      card.appendChild(titleRow);

      var list = document.createElement("dl");
      addDefinition(list, "学习范围", resource.scope);
      addDefinition(list, "本轮重点", loopValue(resource.focus));
      addDefinition(list, "停止标准", loopValue(resource.stopStandard));
      card.appendChild(list);
      container.appendChild(card);
    });
  }

  function renderChecklist(node, record, kind) {
    var isTasks = kind === "tasks";
    var list = node.loops[state.currentLoop][isTasks ? "tasks" : "selfChecks"];
    var selected = isTasks ? record.completedTaskIds : record.passedCheckIds;
    var container = elements[isTasks ? "tasks-list" : "checks-list"];
    container.replaceChildren();

    list.forEach(function (item) {
      var label = document.createElement("label");
      label.className = "check-item";
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selected.indexOf(item.id) >= 0;
      checkbox.addEventListener("change", function () {
        toggleId(selected, item.id, checkbox.checked);
        ensureLearningStatus();
        if (record.status === "passed" && getMissingRequirements(node, record).length) {
          record.status = "learning";
        }
        saveState();
        renderGate(node, record);
        renderHome();
        renderTree();
      });
      label.append(checkbox, textSpan(item.label));
      container.appendChild(label);
    });
  }

  function renderGate(node, record) {
    var missing = getMissingRequirements(node, record);
    if (record.status === "passed") {
      elements["gate-message"].textContent = "本循环已通过。系统会按前置关系推荐下一项。";
      elements["pass-button"].disabled = true;
      return;
    }

    elements["pass-button"].disabled = false;
    if (missing.length) {
      elements["gate-message"].textContent = "尚不能通过，缺少：" + missing.join("；") + "。";
    } else {
      elements["gate-message"].textContent = "必做任务和核心验收已完成，可以主动确认通过。";
    }
  }

  function switchLoop(loop) {
    if (VALID_LOOPS.indexOf(loop) < 0 || loop === state.currentLoop) return;
    if (loop === "practice" && calculateLoopProgress("preview").percent < 100) {
      var proceed = window.confirm("第一循环核心路线尚未完成。是否主动提前进入第二循环？两个循环的记录会保持独立。");
      if (!proceed) return;
    }
    flushPendingDrafts();
    state.currentLoop = loop;
    saveState();
    renderAll();
  }

  function openNode(nodeId) {
    if (!findNode(nodeId)) return;
    flushPendingDrafts();
    state.currentNodeId = nodeId;
    var record = getRecord(nodeId, state.currentLoop);
    if (record.status === "not_started") record.status = "learning";
    saveState();
    showView("learning");
    renderLearning();
  }

  function showView(view) {
    if (currentView === "learning" && view !== "learning") flushPendingDrafts();
    currentView = view;
    elements["home-view"].hidden = view !== "home";
    elements["tree-view"].hidden = view !== "tree";
    elements["manage-view"].hidden = view !== "manage";
    elements["progress-view"].hidden = view !== "progress";
    elements["learning-view"].hidden = view !== "learning";

    document.querySelectorAll(".nav-button").forEach(function (button) {
      var active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (view === "home") renderHome();
    if (view === "tree") renderTree();
    if (view === "manage") renderManage();
    if (view === "progress") renderProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function attemptPass() {
    var node = findNode(state.currentNodeId);
    var record = getRecord(node.id, state.currentLoop);
    var missing = getMissingRequirements(node, record);

    if (missing.length) {
      renderGate(node, record);
      showToast("还不能通过：" + missing.join("；"));
      return;
    }

    record.status = "passed";
    record.blockReason = "";
    var newMilestones = unlockCompletedMilestones();
    saveState();
    renderAll();
    var recommendation = getRecommendation();
    showToast(newMilestones.length
      ? "已通过“" + node.title + "”，并解锁：" + newMilestones.map(function (item) { return item.title; }).join("、") + "。"
      : "已通过“" + node.title + "”。下一项：" + recommendation.node.title + "。");
  }

  function getMissingRequirements(node, record) {
    var loopData = node.loops[state.currentLoop];
    var missing = [];
    var missingTasks = loopData.tasks.filter(function (task) {
      return task.required && record.completedTaskIds.indexOf(task.id) < 0;
    });
    var missingChecks = loopData.selfChecks.filter(function (check) {
      return check.core && record.passedCheckIds.indexOf(check.id) < 0;
    });

    if (missingTasks.length) missing.push(missingTasks.length + " 项必做任务");
    if (missingChecks.length) missing.push(missingChecks.length + " 项核心自我验收");
    if (state.currentLoop === "practice" && getRecord(node.id, "preview").status !== "passed") {
      missing.push("先通过本节点的第一循环");
    }
    if (record.status === "blocked") missing.push("解除当前阻塞标记");
    return missing;
  }

  function setStatus(status) {
    var record = getRecord(state.currentNodeId, state.currentLoop);
    if (status === "blocked") {
      record.status = "blocked";
      elements["block-editor"].hidden = false;
      elements["block-reason"].focus();
    } else {
      record.status = status;
      record.blockReason = "";
      elements["block-editor"].hidden = true;
    }
    saveState();
    renderAll();
  }

  function saveBlockReason() {
    var record = getRecord(state.currentNodeId, state.currentLoop);
    var reason = elements["block-reason"].value.trim();
    if (!reason) {
      showToast("请先填写具体阻塞原因。");
      elements["block-reason"].focus();
      return;
    }
    record.status = "blocked";
    record.blockReason = reason;
    saveState();
    renderAll();
    showToast("阻塞原因已保存。");
  }

  function clearBlock() {
    var record = getRecord(state.currentNodeId, state.currentLoop);
    record.status = "learning";
    record.blockReason = "";
    saveState();
    renderAll();
  }

  function ensureLearningStatus() {
    var record = getRecord(state.currentNodeId, state.currentLoop);
    if (record.status === "not_started") record.status = "learning";
  }

  function getRecommendation() {
    var activeNode = findNode(state.currentNodeId) || nodes[0];
    var activeRecord = getRecord(activeNode.id, state.currentLoop);

    if (["learning", "review", "blocked"].indexOf(activeRecord.status) >= 0) {
      return {
        node: activeNode,
        reason: activeRecord.status === "review"
          ? "这一项被标记为待复习，先恢复它。"
          : activeRecord.status === "blocked"
            ? "这是当前阻塞项：" + (activeRecord.blockReason || "尚未填写原因") + "。"
            : "这是你上次未完成的学习项。"
      };
    }

    var sameModule = nodes.filter(function (node) {
      return node.moduleId === activeNode.moduleId &&
        node.importance === "core" &&
        getRecord(node.id, state.currentLoop).status !== "passed" &&
        prerequisitesSatisfied(node, state.currentLoop);
    });
    if (sameModule.length) {
      return { node: sameModule[0], reason: "这是当前模块中前置条件已经满足的下一个核心知识点。" };
    }

    var available = nodes.filter(function (node) {
      return node.importance === "core" &&
        getRecord(node.id, state.currentLoop).status !== "passed" &&
        prerequisitesSatisfied(node, state.currentLoop);
    });
    if (available.length) {
      return { node: available[0], reason: "前置知识已经完成，可以进入这个核心知识点。" };
    }

    var unfinished = nodes.filter(function (node) {
      return node.importance === "core" && getRecord(node.id, state.currentLoop).status !== "passed";
    });
    if (unfinished.length) {
      var blockedBy = unfinished[0].prerequisites.filter(function (id) {
        return !isPrerequisitePassed(id, state.currentLoop);
      }).map(function (id) {
        var item = findNode(id);
        return item ? item.title : id;
      });
      if (state.currentLoop === "practice" && getRecord(unfinished[0].id, "preview").status !== "passed") {
        blockedBy.unshift(unfinished[0].title + "的第一循环");
      }
      return {
        node: unfinished[0],
        reason: "当前没有满足全部前置条件的核心项。请先完成：" + blockedBy.join("、") + "。"
      };
    }

    return { node: activeNode, reason: "当前循环的全部核心节点已通过，可以检查另一循环。" };
  }

  function getReasonForNode(node) {
    var record = getRecord(node.id, state.currentLoop);
    if (record.status === "review") return "这一项被标记为待复习。";
    if (record.status === "blocked") return "当前阻塞：" + (record.blockReason || "尚未填写原因") + "。";
    var unmet = node.prerequisites.filter(function (id) { return !isPrerequisitePassed(id, state.currentLoop); });
    if (state.currentLoop === "practice" && getRecord(node.id, "preview").status !== "passed") {
      return "本节点的第一循环尚未通过；第二循环记录会保留，但暂时不能确认通过。";
    }
    if (unmet.length) {
      return "直接前置尚未全部通过：" + unmet.map(function (id) { return findNode(id).title; }).join("、") + "。";
    }
    if (!node.prerequisites.length) return "这是路线起点，可以直接开始。";
    return "直接前置已经满足，可以学习本节点。";
  }

  function prerequisitesSatisfied(node, loop) {
    if (loop === "practice" && getRecord(node.id, "preview").status !== "passed") return false;
    return node.prerequisites.every(function (id) { return isPrerequisitePassed(id, loop); });
  }

  function isPrerequisitePassed(nodeId, loop) {
    return getRecord(nodeId, loop).status === "passed";
  }

  function calculateLoopProgress(loop) {
    var coreNodes = nodes.filter(function (node) { return node.importance === "core"; });
    var passed = coreNodes.filter(function (node) { return getRecord(node.id, loop).status === "passed"; }).length;
    return {
      passed: passed,
      total: coreNodes.length,
      percent: coreNodes.length ? Math.round(passed / coreNodes.length * 100) : 0
    };
  }

  function calculateScopedProgress(loop, predicate) {
    var scoped = nodes.filter(predicate);
    var core = scoped.filter(function (node) { return node.importance === "core"; });
    var optional = scoped.filter(function (node) { return node.importance === "optional"; });
    return {
      corePassed: core.filter(function (node) { return getRecord(node.id, loop).status === "passed"; }).length,
      coreTotal: core.length,
      optionalPassed: optional.filter(function (node) { return getRecord(node.id, loop).status === "passed"; }).length,
      optionalTotal: optional.length
    };
  }

  function renderProgress() {
    if (!elements["loop-progress-cards"]) return;
    renderLoopProgressCards();
    renderScopeProgress();
    renderMilestones();
    renderExperimentReviewSummary();
    elements["undo-import"].disabled = !importUndoSnapshot;
  }

  function renderLoopProgressCards() {
    var container = elements["loop-progress-cards"];
    container.replaceChildren();
    VALID_LOOPS.forEach(function (loop) {
      var progress = calculateScopedProgress(loop, function () { return true; });
      var percent = progress.coreTotal ? Math.round(progress.corePassed / progress.coreTotal * 100) : 0;
      var card = document.createElement("article");
      card.className = "progress-card";
      var title = document.createElement("h3");
      title.textContent = LOOP_LABELS[loop];
      var value = document.createElement("strong");
      value.textContent = percent + "%";
      var detail = document.createElement("p");
      detail.textContent = "核心 " + progress.corePassed + " / " + progress.coreTotal +
        " · 选学 " + progress.optionalPassed + " / " + progress.optionalTotal;
      var track = document.createElement("div");
      track.className = "progress-track";
      var bar = document.createElement("span");
      bar.style.width = percent + "%";
      track.appendChild(bar);
      card.append(title, value, detail, track);
      container.appendChild(card);
    });
  }

  function renderScopeProgress() {
    var container = elements["scope-progress-list"];
    container.replaceChildren();
    curriculum.stages.slice().sort(byOrder).forEach(function (stage) {
      var details = document.createElement("details");
      details.className = "scope-progress";
      details.open = true;
      var summary = document.createElement("summary");
      summary.textContent = stage.title;
      details.appendChild(summary);
      curriculum.modules.filter(function (module) {
        return module.stageId === stage.id;
      }).sort(byOrder).forEach(function (module) {
        var row = document.createElement("div");
        row.className = "scope-progress-row";
        var name = document.createElement("strong");
        name.textContent = module.title;
        var values = document.createElement("span");
        values.textContent = VALID_LOOPS.map(function (loop) {
          var p = calculateScopedProgress(loop, function (node) { return node.moduleId === module.id; });
          return (loop === "preview" ? "一循" : "二循") + " 核心 " + p.corePassed + "/" + p.coreTotal +
            "，选学 " + p.optionalPassed + "/" + p.optionalTotal;
        }).join(" · ");
        row.append(name, values);
        details.appendChild(row);
      });
      container.appendChild(details);
    });
  }

  function milestoneDefinitions() {
    var definitions = [];
    VALID_LOOPS.forEach(function (loop) {
      curriculum.modules.forEach(function (module) {
        definitions.push({
          id: "module:" + loop + ":" + module.id,
          title: LOOP_LABELS[loop] + " · " + module.title + "核心路线完成",
          complete: function () {
            var p = calculateScopedProgress(loop, function (node) { return node.moduleId === module.id; });
            return p.coreTotal > 0 && p.corePassed === p.coreTotal;
          }
        });
      });
      curriculum.stages.forEach(function (stage) {
        definitions.push({
          id: "stage:" + loop + ":" + stage.id,
          title: LOOP_LABELS[loop] + " · " + stage.title + "核心路线完成",
          complete: function () {
            var p = calculateScopedProgress(loop, function (node) { return node.stageId === stage.id; });
            return p.coreTotal > 0 && p.corePassed === p.coreTotal;
          }
        });
      });
      definitions.push({
        id: "loop:" + loop,
        title: LOOP_LABELS[loop] + "全部核心路线完成",
        complete: function () {
          var p = calculateScopedProgress(loop, function () { return true; });
          return p.coreTotal > 0 && p.corePassed === p.coreTotal;
        }
      });
    });
    var project = findNode("desktop-assistant");
    if (project) {
      VALID_LOOPS.forEach(function (loop) {
        definitions.push({
          id: "project:" + loop,
          title: LOOP_LABELS[loop] + " · 综合作品完成",
          complete: function () { return getRecord(project.id, loop).status === "passed"; }
        });
      });
    }
    return definitions;
  }

  function unlockCompletedMilestones() {
    var unlocked = [];
    if (!Array.isArray(state.unlockedMilestones)) state.unlockedMilestones = [];
    milestoneDefinitions().forEach(function (definition) {
      if (definition.complete() && state.unlockedMilestones.indexOf(definition.id) < 0) {
        state.unlockedMilestones.push(definition.id);
        unlocked.push(definition);
      }
    });
    return unlocked;
  }

  function renderMilestones() {
    var container = elements["milestone-list"];
    container.replaceChildren();
    var definitions = milestoneDefinitions();
    var unlocked = state.unlockedMilestones.map(function (id) {
      return definitions.find(function (item) { return item.id === id; });
    }).filter(Boolean);
    if (!unlocked.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "尚未解锁里程碑。完成模块核心路线后会在这里记录。";
      container.appendChild(empty);
      return;
    }
    unlocked.forEach(function (definition) {
      var item = document.createElement("article");
      item.className = "milestone-item";
      item.append(textSmall("已解锁"), textSpan(definition.title));
      container.appendChild(item);
    });
  }

  function renderExperimentReview(node, record) {
    var section = elements["experiment-review-section"];
    section.hidden = node.type !== "experiment";
    if (section.hidden) return;
    REVIEW_FIELDS.forEach(function (field) {
      elements["review-" + field].value = record.experimentReview[field] || "";
    });
  }

  function scheduleReviewSave() {
    markSaving();
    clearTimeout(reviewTimer);
    reviewTimer = setTimeout(saveExperimentReview, 500);
  }

  function saveExperimentReview() {
    reviewTimer = null;
    var node = findNode(state.currentNodeId);
    if (!node || node.type !== "experiment") return;
    var record = getRecord(node.id, state.currentLoop);
    REVIEW_FIELDS.forEach(function (field) {
      record.experimentReview[field] = elements["review-" + field].value.slice(0, 1000);
    });
    ensureLearningStatus();
    saveState();
  }

  function renderExperimentReviewSummary() {
    var container = elements["experiment-review-list"];
    container.replaceChildren();
    var entries = [];
    nodes.filter(function (node) { return node.type === "experiment"; }).forEach(function (node) {
      VALID_LOOPS.forEach(function (loop) {
        var review = getRecord(node.id, loop).experimentReview;
        var filled = REVIEW_FIELDS.filter(function (field) { return review[field]; }).length;
        if (filled) entries.push({ node: node, loop: loop, review: review, filled: filled });
      });
    });
    if (!entries.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "尚无实验复盘。实验节点学习卡中会自动保存复盘草稿。";
      container.appendChild(empty);
      return;
    }
    entries.forEach(function (entry) {
      var item = document.createElement("article");
      item.className = "review-summary-item";
      var title = document.createElement("strong");
      title.textContent = entry.node.title + " · " + LOOP_LABELS[entry.loop];
      var meta = document.createElement("p");
      meta.textContent = "已填写 " + entry.filled + " / " + REVIEW_FIELDS.length + " 项";
      var excerpt = document.createElement("p");
      excerpt.textContent = shorten(entry.review.actual || entry.review.problems || entry.review.goal || "", 140);
      var open = manageButton("打开复盘", function () {
        state.currentLoop = entry.loop;
        openNode(entry.node.id);
      });
      item.append(title, meta, excerpt, open);
      container.appendChild(item);
    });
  }

  function getNextTask(node, record) {
    var tasks = node.loops[state.currentLoop].tasks;
    var next = tasks.find(function (task) {
      return task.required && record.completedTaskIds.indexOf(task.id) < 0;
    });
    return next ? next.label : "";
  }

  function findRecentNote() {
    var current = getRecord(state.currentNodeId, state.currentLoop).note.trim();
    if (current) return shorten(current, 90);
    for (var i = nodes.length - 1; i >= 0; i -= 1) {
      var note = getRecord(nodes[i].id, state.currentLoop).note.trim();
      if (note) return nodes[i].title + "：" + shorten(note, 72);
    }
    return "";
  }

  function renderSaveTime() {
    var text = state.updatedAt ? formatDate(state.updatedAt) : "尚未保存";
    elements["save-label"].textContent = text;
    elements["last-saved"].textContent = text;
  }

  function markSaving() {
    elements["save-label"].textContent = "正在保存…";
  }

  function saveNote() {
    noteTimer = null;
    getRecord(state.currentNodeId, state.currentLoop).note = elements["note-input"].value.slice(0, 1000);
    ensureLearningStatus();
    saveState();
    renderHome();
    renderTree();
  }

  function flushPendingDrafts() {
    if (noteTimer !== null) {
      clearTimeout(noteTimer);
      saveNote();
    }
    if (reviewTimer !== null) {
      clearTimeout(reviewTimer);
      saveExperimentReview();
    }
  }

  function moveNode(offset) {
    var index = nodes.findIndex(function (node) { return node.id === state.currentNodeId; });
    var target = nodes[index + offset];
    if (target) openNode(target.id);
  }

  function refreshNodes() {
    var customNodes = Array.isArray(state.customNodes) ? state.customNodes : [];
    nodes = builtInNodes.concat(customNodes.map(function (node) {
      return Object.assign({}, node, { custom: true });
    })).sort(byOrder);
  }

  function renderManage() {
    if (!elements["custom-module"]) return;
    populateModuleSelect();
    populateNodeSelect();
    renderPrerequisiteOptions(elements["custom-node-id"].value);
    renderCustomNodeList();
    renderPersonalResourceList();
  }

  function populateModuleSelect() {
    var selected = elements["custom-module"].value;
    elements["custom-module"].replaceChildren();
    curriculum.modules.slice().sort(byOrder).forEach(function (module) {
      var option = document.createElement("option");
      option.value = module.id;
      option.textContent = findStage(module.stageId).title + " → " + module.title;
      elements["custom-module"].appendChild(option);
    });
    if (selected && findModule(selected).title !== "未知模块") {
      elements["custom-module"].value = selected;
    }
  }

  function populateNodeSelect() {
    var selected = elements["resource-node"].value;
    elements["resource-node"].replaceChildren();
    nodes.forEach(function (node) {
      var option = document.createElement("option");
      option.value = node.id;
      option.textContent = node.title + (node.custom ? "（自定义）" : "");
      elements["resource-node"].appendChild(option);
    });
    if (selected && findNode(selected)) elements["resource-node"].value = selected;
  }

  function renderPrerequisiteOptions(excludedId, checkedIds) {
    var checked = checkedIds || readCheckedPrerequisites();
    elements["custom-prerequisites"].replaceChildren();
    nodes.filter(function (node) { return node.id !== excludedId; }).forEach(function (node) {
      var label = document.createElement("label");
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = node.id;
      checkbox.checked = checked.indexOf(node.id) >= 0;
      label.append(checkbox, textSpan(node.title));
      elements["custom-prerequisites"].appendChild(label);
    });
  }

  function renderCustomNodeList() {
    var container = elements["custom-node-list"];
    container.replaceChildren();
    if (!state.customNodes.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "尚未添加自定义知识点。";
      container.appendChild(empty);
      return;
    }

    state.customNodes.slice().sort(byOrder).forEach(function (node) {
      var item = document.createElement("article");
      item.className = "manage-item";
      var title = document.createElement("strong");
      title.textContent = node.title;
      var meta = document.createElement("p");
      meta.textContent = findModule(node.moduleId).title + " · " + (node.importance === "core" ? "核心" : "选学") + " · 顺序 " + node.order;
      var actions = document.createElement("div");
      actions.className = "manage-actions";
      actions.append(
        manageButton("编辑", function () { editCustomNode(node.id); }),
        manageButton("上移", function () { moveCustomNode(node.id, -5); }),
        manageButton("下移", function () { moveCustomNode(node.id, 5); }),
        manageButton("删除", function () { deleteCustomNode(node.id); })
      );
      item.append(title, meta, actions);
      container.appendChild(item);
    });
  }

  function renderPersonalResourceList() {
    var container = elements["personal-resource-list"];
    container.replaceChildren();
    var entries = [];
    Object.keys(state.customResources).forEach(function (nodeId) {
      var list = Array.isArray(state.customResources[nodeId]) ? state.customResources[nodeId] : [];
      list.forEach(function (resource) {
        entries.push({ nodeId: nodeId, resource: resource });
      });
    });

    if (!entries.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "尚未添加个人资源。";
      container.appendChild(empty);
      return;
    }

    entries.forEach(function (entry) {
      var node = findNode(entry.nodeId);
      var item = document.createElement("article");
      item.className = "manage-item";
      var title = document.createElement("strong");
      title.textContent = entry.resource.title;
      var meta = document.createElement("p");
      meta.textContent = (node ? node.title : "已删除节点") + " · " + entry.resource.scope;
      var remove = manageButton("删除资源", function () {
        deletePersonalResource(entry.nodeId, entry.resource.id);
      });
      item.append(title, meta, remove);
      container.appendChild(item);
    });
  }

  function saveCustomNode(event) {
    event.preventDefault();
    var editingId = elements["custom-node-id"].value;
    var module = findModule(elements["custom-module"].value);
    var id = editingId || makeId("custom-node");
    var candidate = {
      id: id,
      stageId: module.stageId,
      moduleId: module.id,
      title: elements["custom-title"].value.trim(),
      type: elements["custom-type"].value,
      importance: elements["custom-importance"].value,
      order: clampOrder(elements["custom-order"].value),
      objective: elements["custom-objective"].value.trim(),
      prerequisites: readCheckedPrerequisites(),
      resources: [],
      loops: {
        preview: {
          tasks: linesToItems(elements["custom-preview-tasks"].value, id + "-p-task", "required"),
          selfChecks: linesToItems(elements["custom-preview-checks"].value, id + "-p-check", "core")
        },
        practice: {
          tasks: linesToItems(elements["custom-practice-tasks"].value, id + "-x-task", "required"),
          selfChecks: linesToItems(elements["custom-practice-checks"].value, id + "-x-check", "core")
        }
      }
    };

    if (!candidate.title || !candidate.objective) {
      showToast("请填写知识点名称和一句话目标。");
      return;
    }
    if (wouldCreateCycle(candidate)) {
      showToast("保存失败：直接前置会形成循环依赖。");
      return;
    }

    var existingIndex = state.customNodes.findIndex(function (node) { return node.id === id; });
    if (existingIndex >= 0) {
      state.customNodes[existingIndex] = candidate;
      if (state.records[id]) {
        ["preview", "practice"].forEach(function (loop) {
          if (state.records[id][loop]) {
            state.records[id][loop].completedTaskIds = [];
            state.records[id][loop].passedCheckIds = [];
            if (state.records[id][loop].status === "passed") state.records[id][loop].status = "learning";
          }
        });
      }
    } else {
      state.customNodes.push(candidate);
    }
    refreshNodes();
    saveState();
    resetCustomNodeForm();
    renderAll();
    showToast(existingIndex >= 0 ? "自定义知识点已更新，任务验收已重新确认。" : "自定义知识点已添加。");
  }

  function editCustomNode(id) {
    var node = state.customNodes.find(function (item) { return item.id === id; });
    if (!node) return;
    elements["custom-node-id"].value = node.id;
    elements["custom-title"].value = node.title;
    elements["custom-module"].value = node.moduleId;
    elements["custom-type"].value = node.type;
    elements["custom-importance"].value = node.importance;
    elements["custom-order"].value = node.order;
    elements["custom-objective"].value = node.objective;
    elements["custom-preview-tasks"].value = itemsToLines(node.loops.preview.tasks);
    elements["custom-preview-checks"].value = itemsToLines(node.loops.preview.selfChecks);
    elements["custom-practice-tasks"].value = itemsToLines(node.loops.practice.tasks);
    elements["custom-practice-checks"].value = itemsToLines(node.loops.practice.selfChecks);
    renderPrerequisiteOptions(node.id, node.prerequisites);
    elements["cancel-node-edit"].hidden = false;
    elements["custom-title"].focus();
  }

  function resetCustomNodeForm() {
    elements["custom-node-form"].reset();
    elements["custom-node-id"].value = "";
    elements["custom-order"].value = "900";
    elements["cancel-node-edit"].hidden = true;
    renderPrerequisiteOptions("");
  }

  function moveCustomNode(id, delta) {
    var node = state.customNodes.find(function (item) { return item.id === id; });
    if (!node) return;
    node.order = clampOrder(Number(node.order) + delta);
    refreshNodes();
    saveState();
    renderAll();
  }

  function deleteCustomNode(id) {
    var node = state.customNodes.find(function (item) { return item.id === id; });
    if (!node) return;
    var dependents = nodes.filter(function (item) {
      return item.id !== id && item.prerequisites.indexOf(id) >= 0;
    });
    var impact = dependents.length
      ? "以下知识点依赖它：" + dependents.map(function (item) { return item.title; }).join("、") + "。删除后会同时移除这些直接前置引用。"
      : "当前没有其他知识点依赖它。";
    if (!window.confirm("确定删除自定义知识点“" + node.title + "”吗？\n" + impact)) return;
    if (!window.confirm("再次确认：删除后该节点的学习记录和个人资源也会移除。")) return;

    state.customNodes = state.customNodes.filter(function (item) { return item.id !== id; });
    state.customNodes.forEach(function (item) {
      item.prerequisites = item.prerequisites.filter(function (prerequisiteId) { return prerequisiteId !== id; });
    });
    delete state.records[id];
    delete state.customResources[id];
    if (state.currentNodeId === id) state.currentNodeId = "route-overview";
    refreshNodes();
    saveState();
    resetCustomNodeForm();
    renderAll();
    showToast("自定义知识点已删除。");
  }

  function savePersonalResource(event) {
    event.preventDefault();
    var nodeId = elements["resource-node"].value;
    var url = safeHttpUrl(elements["resource-url"].value);
    if (!findNode(nodeId) || !url) {
      showToast("请选择有效知识点，并填写 http 或 https 链接。");
      return;
    }
    if (!Array.isArray(state.customResources[nodeId])) state.customResources[nodeId] = [];
    state.customResources[nodeId].push({
      id: makeId("personal-resource"),
      title: elements["resource-title"].value.trim(),
      url: url,
      scope: elements["resource-scope"].value.trim(),
      focus: elements["resource-focus"].value.trim(),
      stopStandard: elements["resource-stop"].value.trim(),
      primary: false,
      personal: true
    });
    saveState();
    elements["personal-resource-form"].reset();
    renderAll();
    showToast("个人资源已添加。");
  }

  function deletePersonalResource(nodeId, resourceId) {
    if (!window.confirm("确定删除这条个人资源吗？")) return;
    var list = Array.isArray(state.customResources[nodeId]) ? state.customResources[nodeId] : [];
    state.customResources[nodeId] = list.filter(function (resource) { return resource.id !== resourceId; });
    saveState();
    renderAll();
  }

  function getResourcesForNode(node) {
    var builtIn = Array.isArray(node.resources) ? node.resources : [];
    var personal = Array.isArray(state.customResources[node.id]) ? state.customResources[node.id] : [];
    return builtIn.concat(personal);
  }

  function wouldCreateCycle(candidate) {
    var graph = {};
    nodes.forEach(function (node) {
      graph[node.id] = node.id === candidate.id ? candidate.prerequisites.slice() : node.prerequisites.slice();
    });
    graph[candidate.id] = candidate.prerequisites.slice();
    var visiting = {};
    var visited = {};

    function visit(id) {
      if (visiting[id]) return true;
      if (visited[id]) return false;
      visiting[id] = true;
      var dependencies = graph[id] || [];
      for (var i = 0; i < dependencies.length; i += 1) {
        if (visit(dependencies[i])) return true;
      }
      visiting[id] = false;
      visited[id] = true;
      return false;
    }

    return Object.keys(graph).some(visit);
  }

  function isValidCustomNode(node) {
    return Boolean(
      node && typeof node.id === "string" && typeof node.title === "string" &&
      typeof node.moduleId === "string" && Array.isArray(node.prerequisites) &&
      node.loops && isValidLoop(node.loops.preview) && isValidLoop(node.loops.practice)
    );
  }

  function isValidLoop(loop) {
    return Boolean(loop && Array.isArray(loop.tasks) && Array.isArray(loop.selfChecks));
  }

  function sanitizeCustomNodes(value) {
    if (!curriculum || !Array.isArray(curriculum.modules)) return [];
    if (!Array.isArray(value)) return [];
    var knownModules = curriculum.modules.map(function (module) { return module.id; });
    var builtInIds = builtInNodes.map(function (node) { return node.id; });
    var seen = {};

    var cleanNodes = value.filter(isValidCustomNode).filter(function (node) {
      return node.id.indexOf("custom-node-") === 0 &&
        builtInIds.indexOf(node.id) < 0 &&
        knownModules.indexOf(node.moduleId) >= 0 &&
        node.title.trim() &&
        !seen[node.id] && (seen[node.id] = true);
    }).map(function (node) {
      var module = findModule(node.moduleId);
      return {
        id: node.id,
        stageId: module.stageId,
        moduleId: node.moduleId,
        title: node.title.slice(0, 60),
        type: node.type === "experiment" ? "experiment" : "theory",
        importance: node.importance === "core" ? "core" : "optional",
        order: clampOrder(node.order),
        objective: typeof node.objective === "string" ? node.objective.slice(0, 180) : "",
        prerequisites: node.prerequisites.filter(function (id) { return typeof id === "string"; }),
        resources: [],
        loops: {
          preview: sanitizeLoop(node.loops.preview),
          practice: sanitizeLoop(node.loops.practice)
        }
      };
    });
    sanitizePrerequisites(cleanNodes, builtInIds);
    return cleanNodes;
  }

  function sanitizePrerequisites(cleanNodes, builtInIds) {
    var validIds = builtInIds.concat(cleanNodes.map(function (node) { return node.id; }));
    var graph = {};
    builtInNodes.forEach(function (node) {
      graph[node.id] = node.prerequisites.slice();
    });
    cleanNodes.forEach(function (node) {
      graph[node.id] = [];
    });

    cleanNodes.forEach(function (node) {
      node.prerequisites.filter(function (id, index, list) {
        return id !== node.id && validIds.indexOf(id) >= 0 && list.indexOf(id) === index;
      }).forEach(function (id) {
        if (!pathExists(graph, id, node.id, {})) graph[node.id].push(id);
      });
      node.prerequisites = graph[node.id].slice();
    });
  }

  function pathExists(graph, current, target, visited) {
    if (current === target) return true;
    if (visited[current]) return false;
    visited[current] = true;
    return (graph[current] || []).some(function (next) {
      return pathExists(graph, next, target, visited);
    });
  }

  function sanitizeLoop(loop) {
    return {
      tasks: sanitizeItems(loop.tasks, "required"),
      selfChecks: sanitizeItems(loop.selfChecks, "core")
    };
  }

  function sanitizeItems(items, flag) {
    return items.filter(function (item) {
      return item && typeof item.id === "string" && typeof item.label === "string";
    }).map(function (item) {
      var clean = { id: item.id.slice(0, 120), label: item.label.slice(0, 300) };
      clean[flag] = true;
      return clean;
    });
  }

  function sanitizeCustomResources(value, customNodes) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    var validNodeIds = builtInNodes.concat(customNodes).map(function (node) { return node.id; });
    var clean = {};

    Object.keys(value).forEach(function (nodeId) {
      if (validNodeIds.indexOf(nodeId) < 0 || !Array.isArray(value[nodeId])) return;
      clean[nodeId] = value[nodeId].map(sanitizePersonalResource).filter(Boolean);
    });
    return clean;
  }

  function sanitizePersonalResource(resource) {
    if (!resource || typeof resource !== "object") return null;
    var url = safeHttpUrl(resource.url);
    if (!url || typeof resource.title !== "string") return null;
    return {
      id: typeof resource.id === "string" ? resource.id.slice(0, 120) : makeId("personal-resource"),
      title: resource.title.slice(0, 80),
      url: url,
      scope: typeof resource.scope === "string" ? resource.scope.slice(0, 160) : "",
      focus: typeof resource.focus === "string" ? resource.focus.slice(0, 160) : "",
      stopStandard: typeof resource.stopStandard === "string" ? resource.stopStandard.slice(0, 160) : "",
      primary: false,
      personal: true
    };
  }

  function mergeExternalState() {
    var pending = null;
    if (noteTimer !== null || reviewTimer !== null) {
      pending = {
        nodeId: state.currentNodeId,
        loop: state.currentLoop,
        note: noteTimer !== null ? elements["note-input"].value.slice(0, 1000) : null,
        review: reviewTimer !== null ? readExperimentReviewForm() : null
      };
      clearTimeout(noteTimer);
      clearTimeout(reviewTimer);
      noteTimer = null;
      reviewTimer = null;
    }

    state = loadState();
    refreshNodes();
    if (pending && findNode(pending.nodeId)) {
      var record = getRecord(pending.nodeId, pending.loop);
      if (pending.note !== null) record.note = pending.note;
      if (pending.review !== null) record.experimentReview = pending.review;
      if (record.status === "not_started") record.status = "learning";
      saveState();
    }
    renderAll();
    showToast(pending
      ? "已合并另一个标签页的更新，并保留当前未保存草稿。"
      : "检测到另一个标签页的学习记录更新。");
  }

  function readExperimentReviewForm() {
    var review = {};
    REVIEW_FIELDS.forEach(function (field) {
      review[field] = elements["review-" + field].value.slice(0, 1000);
    });
    return review;
  }

  function sanitizeRecords(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    var clean = {};
    Object.keys(value).forEach(function (nodeId) {
      var source = value[nodeId];
      if (!source || typeof source !== "object" || Array.isArray(source)) return;
      clean[nodeId] = {};
      VALID_LOOPS.forEach(function (loop) {
        if (source[loop] && typeof source[loop] === "object" && !Array.isArray(source[loop])) {
          clean[nodeId][loop] = sanitizeRecordLoop(source[loop]);
        }
      });
    });
    return clean;
  }

  function sanitizeRecordLoop(record) {
    return {
      status: VALID_STATUSES.indexOf(record.status) >= 0 ? record.status : "not_started",
      completedTaskIds: sanitizeStringList(record.completedTaskIds),
      passedCheckIds: sanitizeStringList(record.passedCheckIds),
      checkAnswers: {},
      note: typeof record.note === "string" ? record.note.slice(0, 1000) : "",
      blockReason: typeof record.blockReason === "string" ? record.blockReason.slice(0, 200) : "",
      experimentReview: sanitizeExperimentReview(record.experimentReview)
    };
  }

  function sanitizeStringList(value) {
    return Array.isArray(value) ? value.filter(function (item) {
      return typeof item === "string";
    }).map(function (item) {
      return item.slice(0, 120);
    }) : [];
  }

  function sanitizeExperimentReview(value) {
    var clean = {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return clean;
    REVIEW_FIELDS.forEach(function (field) {
      if (typeof value[field] === "string") clean[field] = value[field].slice(0, 1000);
    });
    return clean;
  }

  function exportData() {
    var payload = JSON.stringify(state, null, 2);
    var blob = new Blob([payload], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "stm32-navigator-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("JSON 备份已导出。");
  }

  function importData(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var imported = normalizeImportedState(parsed);
        var summary = importSummary(imported);
        elements["import-summary"].hidden = false;
        elements["import-summary"].textContent = summary;
        if (!window.confirm(summary + "\n\n确认后将覆盖当前个人数据。是否继续？")) return;
        importUndoSnapshot = JSON.stringify(state);
        state = imported;
        refreshNodes();
        if (!findNode(state.currentNodeId)) state.currentNodeId = "route-overview";
        unlockCompletedMilestones();
        saveState();
        renderAll();
        showToast("备份已安全导入；当前会话可撤销本次导入。");
      } catch (error) {
        elements["import-summary"].hidden = false;
        elements["import-summary"].textContent = "导入失败：" + error.message + "。现有数据未被修改。";
        showToast("导入失败，现有数据未被修改。");
      }
    });
    reader.addEventListener("error", function () {
      elements["import-summary"].hidden = false;
      elements["import-summary"].textContent = "文件读取失败，现有数据未被修改。";
      showToast("文件读取失败，现有数据未被修改。");
    });
    reader.readAsText(file);
  }

  function normalizeImportedState(parsed) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("备份根结构无效");
    }
    if (parsed.schemaVersion !== 1) throw new Error("不支持的数据版本");
    if (VALID_LOOPS.indexOf(parsed.currentLoop) < 0) throw new Error("当前循环字段无效");
    if (!parsed.records || typeof parsed.records !== "object" || Array.isArray(parsed.records)) {
      throw new Error("学习记录结构无效");
    }
    if (parsed.customNodes !== undefined && !Array.isArray(parsed.customNodes)) {
      throw new Error("自定义知识点结构无效");
    }
    if (parsed.customResources !== undefined &&
        (!parsed.customResources || typeof parsed.customResources !== "object" || Array.isArray(parsed.customResources))) {
      throw new Error("个人资源结构无效");
    }
    if (parsed.unlockedMilestones !== undefined && !Array.isArray(parsed.unlockedMilestones)) {
      throw new Error("里程碑结构无效");
    }
    validateImportedRecords(parsed.records);
    var clean = createDefaultState();
    clean.currentLoop = parsed.currentLoop;
    clean.currentNodeId = typeof parsed.currentNodeId === "string" ? parsed.currentNodeId : "route-overview";
    clean.updatedAt = typeof parsed.updatedAt === "string" ? parsed.updatedAt : "";
    clean.customNodes = sanitizeCustomNodes(parsed.customNodes);
    if (clean.customNodes.length !== (parsed.customNodes || []).length) {
      throw new Error("自定义知识点包含无效或冲突条目");
    }
    clean.customNodes.forEach(function (node, index) {
      var original = parsed.customNodes[index];
      var originalPrerequisites = original.prerequisites.filter(function (id, itemIndex, list) {
        return typeof id === "string" && id !== original.id && list.indexOf(id) === itemIndex;
      });
      if (originalPrerequisites.length !== node.prerequisites.length ||
          originalPrerequisites.some(function (id) { return node.prerequisites.indexOf(id) < 0; })) {
        throw new Error("自定义知识点包含无效或循环依赖");
      }
    });
    Object.keys(parsed.customResources || {}).forEach(function (nodeId) {
      if (!Array.isArray(parsed.customResources[nodeId])) throw new Error("个人资源列表结构无效");
    });
    clean.customResources = sanitizeCustomResources(parsed.customResources, clean.customNodes);
    var rawResourceCount = Object.keys(parsed.customResources || {}).reduce(function (total, nodeId) {
      return total + (Array.isArray(parsed.customResources[nodeId]) ? parsed.customResources[nodeId].length : 0);
    }, 0);
    var cleanResourceCount = Object.keys(clean.customResources).reduce(function (total, nodeId) {
      return total + clean.customResources[nodeId].length;
    }, 0);
    if (rawResourceCount !== cleanResourceCount) throw new Error("个人资源包含无效条目");
    clean.records = sanitizeRecords(parsed.records);
    clean.unlockedMilestones = Array.isArray(parsed.unlockedMilestones)
      ? parsed.unlockedMilestones.filter(function (id) { return typeof id === "string"; })
      : [];
    return clean;
  }

  function validateImportedRecords(records) {
    Object.keys(records).forEach(function (nodeId) {
      var nodeRecord = records[nodeId];
      if (!nodeRecord || typeof nodeRecord !== "object" || Array.isArray(nodeRecord)) {
        throw new Error("节点“" + nodeId + "”的记录结构无效");
      }
      VALID_LOOPS.forEach(function (loop) {
        var record = nodeRecord[loop];
        if (record === undefined) return;
        if (!record || typeof record !== "object" || Array.isArray(record)) {
          throw new Error("节点“" + nodeId + "”的循环记录无效");
        }
        if (record.status !== undefined && VALID_STATUSES.indexOf(record.status) < 0) {
          throw new Error("节点“" + nodeId + "”的状态无效");
        }
        ["completedTaskIds", "passedCheckIds"].forEach(function (field) {
          if (record[field] !== undefined &&
              (!Array.isArray(record[field]) || record[field].some(function (id) { return typeof id !== "string"; }))) {
            throw new Error("节点“" + nodeId + "”的勾选记录无效");
          }
        });
        if (record.experimentReview !== undefined &&
            (!record.experimentReview || typeof record.experimentReview !== "object" || Array.isArray(record.experimentReview))) {
          throw new Error("节点“" + nodeId + "”的实验复盘无效");
        }
        if (record.experimentReview && Object.keys(record.experimentReview).some(function (field) {
          return REVIEW_FIELDS.indexOf(field) < 0 || typeof record.experimentReview[field] !== "string";
        })) {
          throw new Error("节点“" + nodeId + "”的实验复盘字段无效");
        }
        ["note", "blockReason"].forEach(function (field) {
          if (record[field] !== undefined && typeof record[field] !== "string") {
            throw new Error("节点“" + nodeId + "”的文本记录无效");
          }
        });
      });
    });
  }

  function importSummary(imported) {
    var resourceCount = Object.keys(imported.customResources).reduce(function (total, nodeId) {
      return total + imported.customResources[nodeId].length;
    }, 0);
    var reviewCount = 0;
    Object.keys(imported.records).forEach(function (nodeId) {
      VALID_LOOPS.forEach(function (loop) {
        var record = imported.records[nodeId][loop];
        if (record && REVIEW_FIELDS.some(function (field) { return record.experimentReview[field]; })) {
          reviewCount += 1;
        }
      });
    });
    return "备份摘要：学习节点记录 " + Object.keys(imported.records).length +
      " 个，自定义知识点 " + imported.customNodes.length +
      " 个，个人资源 " + resourceCount + " 条，实验复盘 " + reviewCount + " 份。";
  }

  function undoImport() {
    if (!importUndoSnapshot) return;
    try {
      state = normalizeImportedState(JSON.parse(importUndoSnapshot));
      importUndoSnapshot = null;
      refreshNodes();
      saveState();
      renderAll();
      showToast("已撤销本次导入，恢复导入前数据。");
    } catch (error) {
      showToast("撤销失败，当前数据未改变。");
    }
  }

  function restoreBuiltInRoute() {
    if (!window.confirm("恢复内置路线会移除全部自定义知识点和个人资源，但保留学习记录。是否继续？")) return;
    state.customNodes = [];
    state.customResources = {};
    refreshNodes();
    if (!findNode(state.currentNodeId)) state.currentNodeId = "route-overview";
    saveState();
    renderAll();
    showToast("已恢复内置路线，学习记录仍保留。");
  }

  function clearPersonalData() {
    if (!window.confirm("确定清空全部学习记录、自定义内容、复盘和里程碑吗？")) return;
    if (!window.confirm("再次确认：此操作无法撤销，建议先导出 JSON 备份。")) return;
    state = createDefaultState();
    importUndoSnapshot = null;
    refreshNodes();
    saveState();
    renderAll();
    showToast("个人数据已清空。");
  }

  function readCheckedPrerequisites() {
    return Array.from(elements["custom-prerequisites"].querySelectorAll("input:checked")).map(function (input) {
      return input.value;
    });
  }

  function linesToItems(value, prefix, flag) {
    return value.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean).map(function (label, index) {
      var item = { id: prefix + "-" + (index + 1), label: label };
      item[flag] = true;
      return item;
    });
  }

  function itemsToLines(items) {
    return (Array.isArray(items) ? items : []).map(function (item) { return item.label; }).join("\n");
  }

  function manageButton(label, handler) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary button-small";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function clampOrder(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 900;
    return Math.max(1, Math.min(9999, Math.round(number)));
  }

  function safeHttpUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function findNode(id) {
    return nodes.find(function (node) { return node.id === id; });
  }

  function findStage(id) {
    return curriculum.stages.find(function (stage) { return stage.id === id; }) || { title: "未知阶段" };
  }

  function findModule(id) {
    return curriculum.modules.find(function (module) { return module.id === id; }) || { title: "未知模块" };
  }

  function getObjective(node, loop) {
    return typeof node.objective === "string" ? node.objective : loopValue(node.objective, loop);
  }

  function loopValue(value, loop) {
    var selectedLoop = loop || state.currentLoop;
    if (value && typeof value === "object") return value[selectedLoop] || "";
    return value || "";
  }

  function addDefinition(list, term, description) {
    var dt = document.createElement("dt");
    dt.textContent = term;
    var dd = document.createElement("dd");
    dd.textContent = description;
    list.append(dt, dd);
  }

  function setStatusBadge(element, status) {
    element.textContent = STATUS_LABELS[status] || STATUS_LABELS.not_started;
    element.dataset.status = status;
  }

  function toggleId(list, id, enabled) {
    var index = list.indexOf(id);
    if (enabled && index < 0) list.push(id);
    if (!enabled && index >= 0) list.splice(index, 1);
  }

  function arrow() {
    var item = textSpan("→");
    item.className = "dependency-arrow";
    item.setAttribute("aria-hidden", "true");
    return item;
  }

  function textSpan(text) {
    var span = document.createElement("span");
    span.textContent = text;
    return span;
  }

  function textSmall(text) {
    var small = document.createElement("small");
    small.textContent = text;
    return small;
  }

  function byOrder(a, b) {
    return (a.order || 0) - (b.order || 0);
  }

  function shorten(text, length) {
    return text.length > length ? text.slice(0, length) + "…" : text;
  }

  function formatDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "时间未知";
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function showToast(message) {
    if (!elements.toast) return;
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = setTimeout(function () { elements.toast.hidden = true; }, 4200);
  }

  function showFatalMessage(message) {
    document.querySelector("main").innerHTML = "";
    var panel = document.createElement("section");
    panel.className = "continue-card";
    var heading = document.createElement("h2");
    heading.textContent = "页面暂时无法启动";
    var paragraph = document.createElement("p");
    paragraph.textContent = message;
    panel.append(heading, paragraph);
    document.querySelector("main").appendChild(panel);
  }
}());
