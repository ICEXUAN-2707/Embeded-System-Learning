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
  var curriculum = window.CURRICULUM;
  var nodes = curriculum && Array.isArray(curriculum.nodes) ? curriculum.nodes.slice().sort(byOrder) : [];
  var state = loadState();
  var currentView = "home";
  var noteTimer = null;
  var toastTimer = null;

  var elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();

    if (!curriculum || curriculum.schemaVersion !== 1 || !nodes.length) {
      showFatalMessage("课程导航数据无法读取。请检查 curriculum.js 是否在 app.js 之前加载。");
      return;
    }

    if (!findNode(state.currentNodeId)) {
      state.currentNodeId = nodes[0].id;
    }

    renderAll();
  }

  function cacheElements() {
    [
      "save-label", "home-view", "tree-view", "learning-view", "loop-badge",
      "status-badge", "breadcrumb", "home-title", "recommendation-reason",
      "home-objective", "next-task-label", "continue-button", "loop-progress",
      "loop-progress-bar", "recent-note", "last-saved", "tree-container",
      "back-button", "learning-breadcrumb", "learning-title", "importance-tag",
      "type-tag", "loop-notice", "learning-objective", "learning-reason",
      "dependency-map", "resources-list", "tasks-list", "checks-list",
      "note-input", "gate-message", "pass-button", "block-editor",
      "block-reason", "save-block-button", "clear-block-button",
      "previous-node", "next-node", "toast"
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
      noteTimer = setTimeout(function () {
        getRecord(state.currentNodeId, state.currentLoop).note = elements["note-input"].value;
        ensureLearningStatus();
        saveState();
        renderHome();
        renderTree();
      }, 500);
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

    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) {
        state = loadState();
        renderAll();
        showToast("检测到另一个标签页的学习记录更新。");
      }
    });
  }

  function createDefaultState() {
    return {
      schemaVersion: 1,
      currentLoop: "preview",
      currentNodeId: nodes.length ? nodes[0].id : "route-overview",
      updatedAt: "",
      records: {}
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
      fallback.records = parsed.records && typeof parsed.records === "object" ? parsed.records : {};
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
    return record;
  }

  function defaultRecord() {
    return {
      status: "not_started",
      completedTaskIds: [],
      passedCheckIds: [],
      checkAnswers: {},
      note: "",
      blockReason: ""
    };
  }

  function renderAll() {
    renderHome();
    renderTree();
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

    curriculum.stages.slice().sort(byOrder).forEach(function (stage) {
      var stageDetails = document.createElement("details");
      stageDetails.className = "tree-stage";
      stageDetails.open = true;
      var stageSummary = document.createElement("summary");
      stageSummary.textContent = stage.title;
      stageDetails.appendChild(stageSummary);

      curriculum.modules.filter(function (module) {
        return module.stageId === stage.id;
      }).sort(byOrder).forEach(function (module) {
        var moduleNodes = nodes.filter(function (node) { return node.moduleId === module.id; });
        var passed = moduleNodes.filter(function (node) {
          return node.importance === "core" && getRecord(node.id, state.currentLoop).status === "passed";
        }).length;
        var total = moduleNodes.filter(function (node) { return node.importance === "core"; }).length;

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
          button.append(textSmall((node.importance === "core" ? "核心" : "选学") + " · " + (node.type === "experiment" ? "实验" : "理论")));
          var status = textSpan(STATUS_LABELS[record.status]);
          status.className = "tree-status";
          button.append(status);
          button.addEventListener("click", function () { openNode(node.id); });
          nodeList.appendChild(button);
        });
        moduleDetails.appendChild(nodeList);
        stageDetails.appendChild(moduleDetails);
      });
      elements["tree-container"].appendChild(stageDetails);
    });
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
    container.replaceChildren();
    if (!node.resources.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "当前节点暂无可靠外部链接。";
      container.appendChild(empty);
      return;
    }

    node.resources.forEach(function (resource) {
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
    state.currentLoop = loop;
    saveState();
    renderAll();
  }

  function openNode(nodeId) {
    if (!findNode(nodeId)) return;
    state.currentNodeId = nodeId;
    var record = getRecord(nodeId, state.currentLoop);
    if (record.status === "not_started") record.status = "learning";
    saveState();
    showView("learning");
    renderLearning();
  }

  function showView(view) {
    currentView = view;
    elements["home-view"].hidden = view !== "home";
    elements["tree-view"].hidden = view !== "tree";
    elements["learning-view"].hidden = view !== "learning";

    document.querySelectorAll(".nav-button").forEach(function (button) {
      var active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (view === "home") renderHome();
    if (view === "tree") renderTree();
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
    saveState();
    renderAll();
    var recommendation = getRecommendation();
    showToast("已通过“" + node.title + "”。下一项：" + recommendation.node.title + "。");
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

    return { node: activeNode, reason: "当前循环的五个核心节点已全部通过，可以检查另一循环。" };
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

  function moveNode(offset) {
    var index = nodes.findIndex(function (node) { return node.id === state.currentNodeId; });
    var target = nodes[index + offset];
    if (target) openNode(target.id);
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
