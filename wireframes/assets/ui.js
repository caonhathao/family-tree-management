/* ==========================================================================
   wireframes/assets/ui.js
   Lớp hành vi dùng chung cho 17 màn wireframe.
   - PERM: ma trận quyền 2 trục (cây theo vai trò nhóm, media theo người tải)
   - role pill đổi vai trò để xem màn đổi mặt theo quyền
   - tabs / dialog / toast, render cây theo đúng thuật toán getLayoutedElements
     của group-content.tsx (NODE_WIDTH 150, NODE_HEIGHT 50, SPOUSE_GAP 24,
     SIBLING_GAP 40, RANK_SEP 160) để cây trong wireframe trùng cây trong app.
   ========================================================================== */
(function () {
  "use strict";

  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* ---------- PERM: 2 trục ---------------------------------------------- */
  var PERM = {
    "tree.view":        ["owner", "editor", "viewer", "guest"],
    "tree.edit":        ["owner", "editor"],
    "tree.rename":      ["owner", "editor"],
    "tree.delete":      ["owner"],
    "member.add":       ["owner", "editor"],
    "member.delete":    ["owner", "editor"],
    "member.deleteOther": ["owner", "editor"],
    "relation.add":     ["owner", "editor"],
    "layout.drag":      ["owner", "editor"],
    "layout.auto":      ["owner", "editor"],
    "layout.save":      ["owner", "editor"],
    "nodePhoto.pinSelf": ["owner", "editor", "viewer"],
    "nodePhoto.assign": ["owner", "editor"],
    "history.viewAll":  ["owner", "editor"],
    "history.viewMedia":["owner", "editor", "viewer"],
    "trash.tree":       ["owner", "editor"],
    "trash.media":      ["owner", "editor", "viewer"],
    "media.upload":     ["owner", "editor", "viewer"],
    "media.editOwn":    ["owner", "editor", "viewer"],
    "media.hide":       ["owner", "editor", "viewer"],
    "album.editOwn":    ["owner", "editor", "viewer"],
    "role.change":      ["owner"],
    "role.transfer":    ["owner"],
    "invite.create":    ["owner", "editor"],
    "share.manage":     ["owner"],
    "event.edit":       ["owner", "editor"],
    "import.export":    ["owner", "editor"]
  };

  var ROLE_LABEL = { owner: "CHỦ NHÓM", editor: "BIÊN TẬP VIÊN", viewer: "NGƯỜI XEM", guest: "KHÁCH", anon: "CHƯA ĐĂNG NHẬP" };
  var ROLES = ["owner", "editor", "viewer", "guest", "anon"];

  /* Vai mặc định đến từ ?role= trên URL (index gắn theo flow). Seed này không
     cần localStorage — vẫn chạy khi mở thẳng file:// mà trình duyệt chặn storage. */
  var forcedRole = ROLES.indexOf(new URLSearchParams(location.search).get("role")) !== -1
    ? new URLSearchParams(location.search).get("role")
    : null;

  function getRole() {
    try { return forcedRole || localStorage.getItem("wf:role") || "owner"; } catch (e) { return "owner"; }
  }
  function setRole(r) {
    forcedRole = null; /* user tự đổi bằng pill trên trang này */
    try { localStorage.setItem("wf:role", r); } catch (e) { /* file:// vẫn chạy */ }
    applyRole();
    if (typeof window.wfOnRole === "function") { try { window.wfOnRole(r); } catch (e) { void e; } }
  }
  function can(key) {
    var allow = PERM[key];
    if (!allow) return false;
    return allow.indexOf(getRole()) !== -1;
  }
  function roleLabel(r) { return ROLE_LABEL[r || getRole()] || r; }

  /* So sánh "người đang xem" với tài khoản thật, để demo quyền theo người tải.
     owner -> u1, editor -> u2, viewer -> u4 (xem assets/mock-data.js). */
  var WHO = { owner: "u1", editor: "u2", viewer: "u4" };
  function myId() { return WHO[getRole()] || null; }

  function applyRole() {
    var r = getRole();
    qsa("[data-needs-perm]").forEach(function (el) {
      var keys = el.getAttribute("data-needs-perm").split("|");
      var ok = keys.some(function (k) { return can(k.trim()); });
      if (el.getAttribute("data-hide-when") === "deny") { el.classList.toggle("hidden", !ok); }
      else { el.classList.toggle("hidden", ok); }
    });
    qsa("[data-roles]").forEach(function (el) {
      var list = el.getAttribute("data-roles").split(",").map(function (s) { return s.trim(); });
      el.classList.toggle("hidden", list.indexOf(r) === -1);
    });
    qsa("[data-roles-allof]").forEach(function (el) {
      var list = el.getAttribute("data-roles-allof").split(",").map(function (s) { return s.trim(); });
      el.classList.toggle("hidden", !list.every(function (x) { return list.indexOf(x) !== -1 && x === r; }));
    });
    qsa("[data-roles-noneof]").forEach(function (el) {
      var list = el.getAttribute("data-roles-noneof").split(",").map(function (s) { return s.trim(); });
      el.classList.toggle("hidden", list.indexOf(r) !== -1);
    });
    qsa("[data-role-label]").forEach(function (el) { el.textContent = roleLabel(r); });
    qsa("[data-role-var]").forEach(function (el) { el.textContent = roleLabel(r); });
  }

  /* ---------- role pill (công cụ demo, không thuộc app) ----------------- */
  function mountRolePill() {
    if (qs("#role-pill")) return;
    var el = document.createElement("div");
    el.className = "role-pill";
    el.id = "role-pill";
    el.innerHTML =
      '<span class="muted">Vai trò:</span>' +
      '<select class="select" id="role-pill-select">' +
      ROLES.map(function (r) { return '<option value="' + r + '">' + ROLE_LABEL[r] + "</option>"; }).join("") +
      "</select>";
    document.body.appendChild(el);
    var sel = qs("#role-pill-select");
    sel.value = getRole();
    sel.addEventListener("change", function () { setRole(sel.value); });
  }

  /* ---------- tabs --------------------------------------------------------- */
  function tabs(rootSel, onChange) {
    var root = typeof rootSel === "string" ? qs(rootSel) : rootSel;
    if (!root) return { select: function () {} };
    var triggers = qsa('[role="tab"]', root);
    var panels = qsa('[role="tabpanel"]', root);
    function select(key) {
      triggers.forEach(function (t) {
        t.setAttribute("data-state", t.getAttribute("data-key") === key ? "active" : "inactive");
        t.setAttribute("aria-selected", t.getAttribute("data-key") === key ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.setAttribute("data-state", p.getAttribute("data-key") === key ? "active" : "inactive");
      });
      if (onChange) onChange(key);
    }
    triggers.forEach(function (t) {
      t.addEventListener("click", function () { select(t.getAttribute("data-key")); });
    });
    return { select: select, triggers: triggers };
  }
  function wireTabs(sel, onChange) { return tabs(sel, onChange); }

  /* ---------- dialog ------------------------------------------------------- */
  function openDialog(id) {
    var ov = qs("#" + id + "-overlay");
    var dg = qs("#" + id);
    if (ov) ov.classList.remove("hidden");
    if (dg) { dg.classList.remove("hidden"); dg.setAttribute("data-open", "true"); }
  }
  function closeDialog(id) {
    var ov = qs("#" + id + "-overlay");
    var dg = qs("#" + id);
    if (ov) ov.classList.add("hidden");
    if (dg) { dg.classList.add("hidden"); dg.setAttribute("data-open", "false"); }
  }

  function autoWireDialogs() {
    qsa("[data-open-dialog]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); openDialog(b.getAttribute("data-open-dialog")); });
    });
    qsa("[data-close-dialog]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); closeDialog(b.getAttribute("data-close-dialog")); });
    });
    qsa(".overlay").forEach(function (ov) {
      ov.addEventListener("click", function () {
        var dg = qs("#" + ov.id.replace(/-overlay$/, ""));
        if (dg && dg.getAttribute("data-static") !== "true") closeDialog(dg.id);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      qsa(".dialog").forEach(function (dg) {
        if (!dg.classList.contains("hidden") && dg.getAttribute("data-static") !== "true") closeDialog(dg.id);
      });
    });
  }

  /* ---------- toast (sonner) ---------------------------------------------- */
  function toast(title, description, type) {
    var box = qs("#toaster");
    if (!box) {
      box = document.createElement("div");
      box.className = "toaster";
      box.id = "toaster";
      document.body.appendChild(box);
    }
    if (qs("#role-pill")) box.setAttribute("data-above-pill", "true");
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("data-type", type || "default");
    t.innerHTML =
      '<div class="flex flex-col gap-1 min-w-0 flex-1">' +
      '<div class="toast-title">' + esc(title) + "</div>" +
      (description ? '<div class="toast-desc">' + esc(description) + "</div>" : "") +
      "</div>" +
      '<button class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Đóng">✕</button>';
    box.appendChild(t);
    var kill = function () { if (t.parentNode) t.parentNode.removeChild(t); };
    t.querySelector("button").addEventListener("click", kill);
    setTimeout(kill, 5200);
  }

  /* ---------- tiến trình nhiều bước --------------------------------------- */
  function runProgress(el, opts) {
    var steps = (opts && opts.steps) || [];
    var i = 0;
    var bar = qs("[data-bar]", el);
    var label = qs("[data-step]", el);
    return new Promise(function (resolve) {
      function step() {
        if (i >= steps.length) { if (opts && opts.onDone) opts.onDone(); resolve(); return; }
        if (label) label.textContent = steps[i];
        if (bar) bar.style.width = Math.round(((i + 1) / steps.length) * 100) + "%";
        i += 1;
        setTimeout(step, 420);
      }
      step();
    });
  }

  /* ---------- cây gia phả: port getLayoutedElements của group-content.tsx -- */
  var LAYOUT = { NODE_WIDTH: 150, NODE_HEIGHT: 50, SPOUSE_GAP: 24, SIBLING_GAP: 40, RANK_SEP: 160 };

  function layoutTree(members, relations) {
    var memberMap = {};
    members.forEach(function (m) { memberMap[m.id] = m; });
    var positions = {};

    function getSpouseOf(id) {
      for (var i = 0; i < relations.length; i++) {
        var r = relations[i];
        if (r.type !== "SPOUSE") continue;
        if (r.fromMemberId === id) return r.toMemberId;
        if (r.toMemberId === id) return r.fromMemberId;
      }
      return null;
    }
    function getChildrenOf(id) {
      var out = [];
      relations.forEach(function (r) {
        if (r.type === "PARENT" && r.fromMemberId === id) out.push(r.toMemberId);
        if (r.type === "CHILD" && r.toMemberId === id) out.push(r.fromMemberId);
      });
      return out;
    }
    function hasParent(id) {
      return relations.some(function (r) {
        return (r.type === "PARENT" && r.toMemberId === id) || (r.type === "CHILD" && r.fromMemberId === id);
      });
    }
    var isMale = function (id) { return memberMap[id] && memberMap[id].gender === "MALE"; };
    function sortChildren(ids) {
      return ids.slice().sort(function (a, b) {
        var ma = memberMap[a], mb = memberMap[b];
        if (ma && mb && ma.birthDate && mb.birthDate) {
          return new Date(ma.birthDate).getTime() - new Date(mb.birthDate).getTime();
        }
        var g = (Number(isMale(a)) - Number(isMale(b))) * -1;
        if (g !== 0) return g;
        return String((ma && ma.fullName) || "").localeCompare(String((mb && mb.fullName) || ""));
      });
    }
    function measureSubtree(id, visited) {
      if (visited.has(id)) return LAYOUT.NODE_WIDTH;
      visited.add(id);
      var spouse = getSpouseOf(id);
      var ownKids = getChildrenOf(id);
      if (spouse) {
        getChildrenOf(spouse).forEach(function (c) { if (ownKids.indexOf(c) === -1) ownKids.push(c); });
      }
      var kids = sortChildren(ownKids.filter(function (c) { return c !== spouse && !visited.has(c); }));
      if (kids.length === 0) return spouse ? LAYOUT.NODE_WIDTH * 2 + LAYOUT.SPOUSE_GAP : LAYOUT.NODE_WIDTH;
      var widths = kids.map(function (c) { return measureSubtree(c, visited); });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) + LAYOUT.SIBLING_GAP * (widths.length - 1);
      var self = spouse ? LAYOUT.NODE_WIDTH * 2 + LAYOUT.SPOUSE_GAP : LAYOUT.NODE_WIDTH;
      return Math.max(total, self);
    }
    function layoutSubtree(id, cx, visited) {
      if (visited.has(id)) return;
      visited.add(id);
      var gen = (memberMap[id] && memberMap[id].generation) || 0;
      var y = gen * LAYOUT.RANK_SEP;
      var spouse = getSpouseOf(id);
      if (spouse && !visited.has(spouse)) {
        visited.add(spouse);
        positions[id] = { x: cx - (LAYOUT.NODE_WIDTH + LAYOUT.SPOUSE_GAP) / 2, y: y };
        positions[spouse] = { x: cx + (LAYOUT.NODE_WIDTH + LAYOUT.SPOUSE_GAP) / 2, y: y };
      } else {
        positions[id] = { x: cx, y: y };
      }
      var ownKids = getChildrenOf(id);
      if (spouse) {
        getChildrenOf(spouse).forEach(function (c) { if (ownKids.indexOf(c) === -1) ownKids.push(c); });
      }
      var kids = sortChildren(ownKids.filter(function (c) { return c !== id && c !== spouse && !visited.has(c); }));
      if (kids.length === 0) return;
      var subs = kids.map(function (k) { return { id: k, width: measureSubtree(k, new Set()) }; });
      var total = subs.reduce(function (a, s) { return a + s.width; }, 0) + LAYOUT.SIBLING_GAP * (subs.length - 1);
      var cursor = cx - total / 2;
      subs.forEach(function (s) {
        layoutSubtree(s.id, cursor + s.width / 2, visited);
        cursor += s.width + LAYOUT.SIBLING_GAP;
      });
    }

    var allIds = members.map(function (m) { return m.id; });
    var roots = allIds.filter(function (id) { return !hasParent(id); });
    var rootWidths = roots.map(function (r) { return { id: r, width: measureSubtree(r, new Set()) }; });
    var list = rootWidths.length ? rootWidths : allIds.map(function (id) { return { id: id, width: LAYOUT.NODE_WIDTH * 2 }; });
    var total = list.reduce(function (a, s) { return a + s.width; }, 0) + LAYOUT.SIBLING_GAP * Math.max(0, list.length - 1);
    var cursor = -total / 2;
    var seen = new Set();
    list.forEach(function (r) {
      layoutSubtree(r.id, cursor + r.width / 2, seen);
      cursor += r.width + LAYOUT.SIBLING_GAP;
    });

    return positions;
  }

  function initialOf(fullName) {
    var parts = String(fullName || "").trim().split(/\s+/);
    var last = parts[parts.length - 1];
    return last ? last.charAt(0).toUpperCase() : "?";
  }

  /* renderTree: vẽ node + edge vào một .flow-wrap.
     opts: { members, relations, draggable, onSelect, selectedId, showHandles } */
  function renderTree(wrapSel, opts) {
    var wrap = typeof wrapSel === "string" ? qs(wrapSel) : wrapSel;
    if (!wrap) return null;
    var members = opts.members || [];
    var relations = opts.relations || [];
    var positions = layoutTree(members, relations);

    var canvas = qs(".flow-canvas", wrap);
    var svg = qs(".flow-svg", wrap);
    var W = LAYOUT.NODE_WIDTH, H = LAYOUT.NODE_HEIGHT;

    function center(p) { return { x: p.x + W / 2, y: p.y + H / 2 }; }

    /* Edge kiểu react-flow "smoothstep": đường gấp khúc vuông góc bo nhẹ,
       nối từ mép node cha (đáy) xuống mép node con (đỉnh), như app thật. */
    function orthoPath(x1, y1, x2, y2) {
      var r = 6, s = x1 <= x2 ? 1 : -1, dx = Math.abs(x2 - x1), my = (y1 + y2) / 2;
      r = Math.min(r, Math.abs(my - y1), Math.abs(my - y2), dx / 2);
      var ax = x1 + s * r, bx = x2 - s * r;
      return (
        "M " + x1 + " " + y1 +
        " L " + x1 + " " + (my - r) +
        " Q " + x1 + " " + my + " " + ax + " " + my +
        " L " + bx + " " + my +
        " Q " + x2 + " " + my + " " + x2 + " " + (my + r) +
        " L " + x2 + " " + y2
      );
    }
    function childPath(top, bottom) {
      var sx = center(top).x, ex = center(bottom).x;
      var sy = top.y + H, ey = bottom.y;
      return sx === ex
        ? "M " + sx + " " + sy + " L " + ex + " " + ey
        : orthoPath(sx, sy, ex, ey);
    }
    function spousePath(a, b) {
      // Vợ chồng cùng hàng: đường thẳng ngang nối mép phải -> mép trái
      var y = a.y + H / 2;
      return "M " + (a.x + W) + " " + y + " L " + b.x + " " + y;
    }

    var edges = relations.map(function (r) {
      var a = positions[r.fromMemberId], b = positions[r.toMemberId];
      if (!a || !b) return "";
      if (r.type === "SPOUSE") {
        return '<path class="flow-edge" data-kind="spouse" d="' + spousePath(a, b) + '"/>';
      }
      var top = r.type === "PARENT" ? a : b;
      var bottom = r.type === "PARENT" ? b : a;
      return '<path class="flow-edge" d="' + childPath(top, bottom) + '"/>';
    }).join("");

    var showHandles = opts.showHandles === true || (opts.showHandles !== false && opts.draggable !== false);
    var nodes = members.map(function (m) {
      var p = positions[m.id] || { x: 0, y: 0 };
      var photo = m.photoId && opts.photoUrl ? opts.photoUrl(m.photoId) : null;
      return (
        '<div class="node" data-id="' + esc(m.id) + '" data-gender="' + esc(m.gender) + '"' +
        ' data-drag="' + (opts.draggable ? "true" : "false") + '"' +
        ' data-selected="' + (opts.selectedId === m.id ? "true" : "false") + '"' +
        ' style="left:' + p.x + "px;top:" + p.y + 'px">' +
        (m.pinnedMemberId ? '<div class="node-pin"></div>' : "") +
        '<div class="node-body">' +
        '<div class="node-avatar">' + (photo ? '<img src="' + esc(photo) + '" alt=""/>' : esc(initialOf(m.fullName))) + "</div>" +
        '<div class="node-info">' +
        '<div class="node-name">' + esc(m.fullName) + "</div>" +
        (m.relationshipLabel ? '<div class="node-rel">' + esc(m.relationshipLabel) + "</div>" : "") +
        '<div class="node-meta">' + esc(m.gender === "MALE" ? "Nam" : "Nữ") +
        (m.birthDate ? " · " + esc(formatDate(m.birthDate)) : "") +
        (m.photoId ? " · có ảnh" : "") +
        "</div></div></div>" +
        ['t', 'b', 'l', 'r'].map(function (k) {
          return '<div class="node-handle" data-pos="' + k + '" data-off="' + (showHandles ? "false" : "true") + '"></div>';
        }).join("") +
        "</div>"
      );
    }).join("");

    svg.innerHTML = edges;
    canvas.innerHTML = nodes;

    if (opts.onSelect) {
      qsa(".node", canvas).forEach(function (n) {
        n.addEventListener("click", function () { opts.onSelect(n.getAttribute("data-id")); });
      });
    }
    if (opts.draggable) {
      qsa(".node", canvas).forEach(function (n) { attachDrag(n); });
    }
    return { positions: positions };
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.getDate().toString().padStart(2, "0") + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
  }

  function attachDrag(node) {
    node.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY;
      var ox = parseFloat(node.style.left), oy = parseFloat(node.style.top);
      var moved = false;
      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
        moved = true;
        node.style.left = ox + dx + "px";
        node.style.top = oy + dy + "px";
      }
      function up() {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        if (moved && typeof window.wfOnNodeMoved === "function") {
          try { window.wfOnNodeMoved(node.getAttribute("data-id")); } catch (err) { void err; }
        }
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
  }

  /* ---------- zoom / fit --------------------------------------------------- */
  function transformOf(wrap) {
    var vp = qs(".flow-viewport", wrap);
    if (!vp) return { s: 1, tx: 0, ty: 0 };
    var m = /scale\(([\d.]+)\)\s*translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(vp.style.transform);
    return m ? { s: parseFloat(m[1]), tx: parseFloat(m[2]), ty: parseFloat(m[3]) } : { s: 1, tx: 0, ty: 0 };
  }
  function setTransform(wrap, s, tx, ty) {
    var vp = qs(".flow-viewport", wrap);
    if (vp) vp.style.transform = "scale(" + s + ") translate(" + tx + "px," + ty + "px)";
  }
  function zoomBy(wrapSel, factor) {
    var wrap = typeof wrapSel === "string" ? qs(wrapSel) : wrapSel;
    if (!wrap) return;
    var t = transformOf(wrap);
    setTransform(wrap, Math.min(2, Math.max(0.4, t.s * factor)), t.tx, t.ty);
  }
  function fitView(wrapSel) {
    var wrap = typeof wrapSel === "string" ? qs(wrapSel) : wrapSel;
    if (!wrap) return;
    var nodes = qsa(".node", wrap);
    if (!nodes.length) { setTransform(wrap, 1, 0, 0); return; }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      var x = parseFloat(n.style.left), y = parseFloat(n.style.top);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + LAYOUT.NODE_WIDTH); maxY = Math.max(maxY, y + LAYOUT.NODE_HEIGHT);
    });
    var pad = 20;
    var w = wrap.clientWidth, h = wrap.clientHeight;
    var s = Math.min(1, (w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY));
    if (!isFinite(s) || s <= 0) s = 1;
    setTransform(wrap, s, (w / s - (maxX - minX)) / 2 - minX, (h / s - (maxY - minY)) / 2 - minY);
  }

  /* ---------- bật/tắt theo data-attr (grid, drawer) ----------------------- */
  function wireToggles() {
    qsa("[data-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = qs(b.getAttribute("data-toggle"));
        if (!t) return;
        if (t.hasAttribute("data-collapsed")) {
          t.setAttribute("data-collapsed", t.getAttribute("data-collapsed") === "true" ? "false" : "true");
        } else {
          t.classList.toggle("hidden");
        }
        b.setAttribute("data-state", t.classList.contains("hidden") ? "off" : "on");
      });
    });
    qsa("[data-check-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var cb = qs(b.getAttribute("data-check-toggle"));
        if (!cb) return;
        var on = cb.getAttribute("data-checked") !== "true";
        cb.setAttribute("data-checked", on ? "true" : "false");
        var t = qs(b.getAttribute("data-check-target"));
        if (t) t.setAttribute("data-off", on ? "true" : "false");
      });
    });
  }

  function wireColorPickers() {
    qsa("[data-color]").forEach(function (el) {
      var c = getComputedStyle(el).getPropertyValue(el.getAttribute("data-color")).trim();
      el.style.backgroundColor = "color-mix(in srgb, " + c + " 12%, transparent)";
      el.style.color = c;
      el.style.borderColor = c;
    });
  }

  /* ---------- boot --------------------------------------------------------- */
  function boot() {
    /* Index gắn ?role=… theo flow; forcedRole đã đọc xong ở đầu module,
       không phụ thuộc localStorage nên chạy được dưới file://. Vẫn đổi tay
       được bằng pill — setRole sẽ bỏ forcedRole cho trang này. */
    mountRolePill();
    autoWireDialogs();
    wireToggles();
    wireColorPickers();
    applyRole();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.WF = {
    qs: qs, qsa: qsa, esc: esc,
    PERM: PERM, ROLES: ROLES, ROLE_LABEL: ROLE_LABEL, WHO: WHO, LAYOUT: LAYOUT,
    can: can, getRole: getRole, setRole: setRole, roleLabel: roleLabel, myId: myId, applyRole: applyRole,
    tabs: tabs, wireTabs: wireTabs,
    openDialog: openDialog, closeDialog: closeDialog,
    toast: toast, runProgress: runProgress,
    renderTree: renderTree, layoutTree: layoutTree, initialOf: initialOf, formatDate: formatDate,
    zoomBy: zoomBy, fitView: fitView, applyRoleNow: applyRole
  };
})();
