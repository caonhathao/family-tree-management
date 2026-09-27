/* Wireframe kit — helper dùng chung. Không phụ thuộc thư viện ngoài. */
(function (global) {
  "use strict";

  var LS_ROLE = "wf:role";
  var ROLES = [
    ["owner", "OWNER — chủ nhóm"],
    ["editor", "EDITOR — biên tập viên"],
    ["viewer", "VIEWER — chỉ xem"],
    ["guest", "Khách — mở link chia sẻ"],
    ["anon", "Chưa đăng nhập"]
  ];

  /* Ma trận quyền lấy từ fe/06 §1. owner/editor/viewer/guest/anon */
  var PERM = {
    "tree.view": ["owner", "editor", "viewer", "guest"],
    "tree.edit": ["owner", "editor"],
    "tree.name": ["owner", "editor"],
    "member.add": ["owner", "editor"],
    "member.delete": ["owner", "editor"],
    "relation.add": ["owner", "editor"],
    "layout.drag": ["owner", "editor"],
    "layout.auto": ["owner", "editor"],
    "layout.save": ["owner", "editor"],
    "nodePhoto.pinSelf": ["owner", "editor", "viewer"],
    "nodePhoto.assign": ["owner", "editor"],
    "nodePhoto.view": ["owner", "editor", "viewer", "guest"],
    "history.viewAll": ["owner", "editor"],
    "history.viewMedia": ["owner", "editor", "viewer", "guest"],
    "history.viewTreeOnly": [],
    "trash.tree": ["owner", "editor"],
    "trash.own": ["owner", "editor", "viewer"],
    "media.upload": ["owner", "editor", "viewer"],
    "media.editOwn": ["owner", "editor", "viewer", "guest"],
    "media.hide": ["owner", "editor", "viewer", "guest"],
    "media.trash": ["owner", "editor", "viewer", "guest"],
    "album.editOwn": ["owner", "editor", "viewer", "guest"],
    "role.change": ["owner"],
    "role.transfer": ["owner"],
    "invite.create": ["owner", "editor"],
    "share.manage": ["owner"],
    "event.edit": ["owner", "editor"],
    "import.export": ["owner", "editor"]
  };

  var role = localStorage.getItem(LS_ROLE) || "owner";

  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function getRole() { return role; }
  function can(key) { var a = PERM[key]; return !!a && a.indexOf(role) >= 0; }

  /* Ẩn/hiện mọi phần tử có data-roles="OWNER,EDITOR" theo role hiện tại.
     data-roles-allof -> phải có đủ; data-roles-noneof -> cấm khi trùng. */
  function applyRole() {
    qsa("[data-roles]").forEach(function (el) {
      var list = el.getAttribute("data-roles").split(",").map(function (s) { return s.trim(); });
      var show = list.indexOf(role) >= 0;
      var all = (el.getAttribute("data-roles-allof") || "").split(",").map(function (s) { return s.trim(); });
      all.forEach(function (r) { if (r && all.indexOf(r) >= 0 && list.indexOf(r) < 0) show = false; });
      var none = (el.getAttribute("data-roles-noneof") || "").split(",").map(function (s) { return s.trim(); });
      if (none.indexOf(role) >= 0) show = false;
      el.hidden = !show;
    });
    qsa("[data-needs-perm]").forEach(function (el) {
      el.hidden = !can(el.getAttribute("data-needs-perm"));
    });
    document.body.setAttribute("data-role", role);
    qsa("[data-role-label]").forEach(function (el) { el.textContent = roleName(role); });
    qsa("[data-role-else]").forEach(function (el) { el.hidden = role === el.getAttribute("data-role-else"); });
  }

  function roleName(r) {
    var f = ROLES.filter(function (x) { return x[0] === r; });
    return f.length ? f[0][1] : r;
  }

  function mountRoleSwitcher() {
    var host = qs("[data-role-switch]");
    if (!host) return;
    var sel = document.createElement("select");
    ROLES.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r[0]; o.textContent = r[1];
      sel.appendChild(o);
    });
    sel.value = role;
    sel.addEventListener("change", function () {
      role = sel.value;
      localStorage.setItem(LS_ROLE, role);
      applyRole();
      if (typeof global.wfOnRole === "function") global.wfOnRole(role);
    });
    host.appendChild(sel);
  }

  /* ---------- dialog ---------- */
  function openDialog(id) {
    var d = typeof id === "string" ? qs("#" + id) : id;
    if (d) d.hidden = false;
  }
  function closeDialog(id) {
    var d = typeof id === "string" ? qs("#" + id) : id;
    if (d) d.hidden = true;
  }
  function wireDialogs() {
    qsa("[data-open-dialog]").forEach(function (b) {
      b.addEventListener("click", function () { openDialog(b.getAttribute("data-open-dialog")); });
    });
    qsa("[data-close-dialog]").forEach(function (b) {
      b.addEventListener("click", function () { closeDialog(b.getAttribute("data-close-dialog")); });
    });
    qsa(".wf-overlay").forEach(function (ov) {
      ov.addEventListener("click", function (e) { if (e.target === ov) ov.hidden = true; });
    });
  }

  /* ---------- toast ---------- */
  function toast(msg, kind) {
    var host = qs("#wf-toasts");
    if (!host) {
      host = document.createElement("div");
      host.id = "wf-toasts";
      document.body.appendChild(host);
    }
    var t = document.createElement("div");
    t.className = "wf-toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------- tabs ---------- */
  function wireTabs(rootSel, onChange) {
    var root = qs(rootSel);
    if (!root) return;
    var btns = qsa('[role="tab"]', root);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
        var id = b.getAttribute("data-tab");
        qsa(".wf-tabpanel", root).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
        if (typeof onChange === "function") onChange(id);
      });
    });
  }

  /* ---------- thanh tiến trình giả lập ---------- */
  function runProgress(el, opts) {
    opts = opts || {};
    var steps = opts.steps || ["Đọc tệp", "Kiểm tra dữ liệu", "Đối chiếu phiên bản", "Ghi vào cơ sở dữ liệu"];
    var done = 0;
    var onDone = opts.onDone;
    return new Promise(function (resolve) {
      var timer = setInterval(function () {
        done += 1;
        el.querySelector("i").style.width = Math.round((done / steps.length) * 100) + "%";
        var lbl = qs("[data-prog-step]", el.parentNode);
        if (lbl) lbl.textContent = done < steps.length ? steps[done] : "Xong";
        if (done >= steps.length) {
          clearInterval(timer);
          if (onDone) onDone();
          resolve();
        }
      }, 420);
    });
  }

  /* ---------- cây (bố cục 1 tầng: x = thế hệ, y = thứ tự) ---------- */
  function layoutTree(members) {
    var byGen = {};
    members.forEach(function (m) {
      if (m.hidden) return;
      (byGen[m.generation] = byGen[m.generation] || []).push(m);
    });
    var pos = {};
    var NW = 168, NH = 104, GX = 210, GY = 128, OX = 40, OY = 40;
    Object.keys(byGen).sort(function (a, b) { return a - b; }).forEach(function (g) {
      byGen[g].forEach(function (m, i) {
        pos[m.id] = { x: OX + (g - 1) * GX, y: OY + i * GY, w: NW, h: NH };
      });
    });
    return pos;
  }

  function edgePath(a, b) {
    var ax = a.x + a.w / 2, ay = a.y + a.h;
    var bx = b.x + b.w / 2, by = b.y;
    var my = (ay + by) / 2;
    return "M" + ax + "," + ay + " C" + ax + "," + my + " " + bx + "," + my + " " + bx + "," + by;
  }

  function spousePath(a, b) {
    var ax = a.x + a.w, ay = a.y + a.h / 2;
    var bx = b.x, by = b.y + b.h / 2;
    return "M" + ax + "," + ay + " C" + (ax + 40) + "," + ay + " " + (bx - 40) + "," + by + " " + bx + "," + by;
  }

  /* Vẽ cây. draggable = role được phép kéo (Q9). */
  function renderTree(stageSel, members, opts) {
    opts = opts || {};
    var stage = qs(stageSel);
    if (!stage) return { pos: {} };
    var pos = layoutTree(members);
    var inner = qs(".wf-stage-inner", stage) || stage;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    qsa(".wf-node", stage).forEach(function (n) { n.remove(); });
    if (svg.parentNode) svg.remove();

    members.forEach(function (m) {
      if (m.hidden) return;
      var p = pos[m.id];
      if (!p) return;
      if (m.parentId && pos[m.parentId]) {
        var ln = document.createElementNS("http://www.w3.org/2000/svg", "path");
        ln.setAttribute("d", edgePath(pos[m.parentId], p));
        ln.setAttribute("fill", "none");
        svg.appendChild(ln);
      }
      if (m.spouseId && pos[m.spouseId]) {
        var sl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        sl.setAttribute("d", spousePath(pos[m.spouseId], p));
        sl.setAttribute("fill", "none");
        sl.setAttribute("class", "spouse");
        svg.appendChild(sl);
      }
    });
    inner.appendChild(svg);

    var frag = document.createDocumentFragment();
    members.forEach(function (m) {
      if (m.hidden) return;
      var p = pos[m.id];
      var el = document.createElement("div");
      el.className = "wf-node" + (m.selected ? " sel" : "");
      el.style.left = p.x + "px";
      el.style.top = p.y + "px";
      el.dataset.id = m.id;
      var ico = "";
      if (m.birthday) ico += '<span title="Có sinh nhật">🎂</span>';
      if (m.deceased) ico += '<span title="Đã mất">✝</span>';
      if (m.photoId) ico += '<span title="Node đã gắn ảnh">🖼</span>';
      el.innerHTML =
        '<div class="ico-row">' + ico + "</div>" +
        '<div class="ph">' + (m.photoId ? "ảnh node<br>(photoId)" : "chưa gắn ảnh") + "</div>" +
        '<div class="nm">' + esc(m.fullName) + "</div>" +
        '<div class="meta"><span>Đời ' + m.generation + "</span>" +
        (m.birthDate ? "<span>" + m.birthDate + "</span>" : "") +
        (m.deceased ? '<span class="wf-badge danger">Đã mất</span>' : "") + "</div>";
      frag.appendChild(el);
    });
    inner.appendChild(frag);

    if (opts.draggable) makeDraggable(stage, members, pos, function () { if (opts.onMove) opts.onMove(); });
    return { pos: pos, inner: inner };
  }

  function makeDraggable(stage, members, pos, onEnd) {
    var drag = null;
    qsa(".wf-node", stage).forEach(function (el) {
      el.addEventListener("pointerdown", function (e) {
        drag = { el: el, dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop };
        el.classList.add("dragging");
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      el.addEventListener("pointermove", function (e) {
        if (!drag || drag.el !== el) return;
        el.style.left = Math.max(0, e.clientX - drag.dx - stage.scrollLeft) + "px";
        el.style.top = Math.max(0, e.clientY - drag.dy - stage.scrollTop) + "px";
      });
      el.addEventListener("pointerup", function () {
        if (drag && drag.el === el) {
          el.classList.remove("dragging");
          var m = members.filter(function (x) { return x.id === el.dataset.id; })[0];
          if (m) {
            m.moved = true;
            pos[m.id].x = el.offsetLeft;
            pos[m.id].y = el.offsetTop;
          }
          drag = null;
          if (onEnd) onEnd(m);
        }
      });
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  global.WF = {
    qs: qs, qsa: qsa, esc: esc, can: can, PERM: PERM,
    getRole: getRole, roleName: roleName, applyRole: applyRole,
    openDialog: openDialog, closeDialog: closeDialog, toast: toast,
    wireTabs: wireTabs, runProgress: runProgress,
    layoutTree: layoutTree, renderTree: renderTree
  };

  document.addEventListener("DOMContentLoaded", function () {
    mountRoleSwitcher();
    wireDialogs();
    applyRole();
  });
})(window);
