'use strict'

var M = Math,
	D = document,
	W = window,
	FA = Float32Array,
	gl,
	im = new FA([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1]),
	pm,
	vm = new FA(im),
	cm = new FA(16),
	sm = new FA(16),
	m = new FA(16),
	far = 1000,
	sky = [.2, .5, .8, 1],
	light = [.5, .5, 1],
	brightness = 1,
	program,
	entitiesLength = 0,
	entities = [],
	bulletsStart,
	bulletsLength,
	debrisStart,
	debrisLength,
	jetsStart,
	jetsLength,
	player,
	width,
	height,
	now,
	factor,
	last,
	pointersLength,
	pointersX = [],
	pointersY = [],
	keysDown = [],
	colorWhite = [1, 1, 1, 1],
	colorRed = [1, 0, 0, 1],
	colorGreen = [0, 1, 0, 1],
	colorBlue = [0, 0, 1, 1],
	colorYellow = [1, 1, 0, 1],
	invertedSky = [.8, .5, .2, 1]

M.PI2 = M.PI2 || M.PI / 2
M.TAU = M.TAU || M.PI * 2

// from https://github.com/toji/gl-matrix
function invert(out, a) {
	var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
		a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
		a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
		a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],
		b00 = a00 * a11 - a01 * a10,
		b01 = a00 * a12 - a02 * a10,
		b02 = a00 * a13 - a03 * a10,
		b03 = a01 * a12 - a02 * a11,
		b04 = a01 * a13 - a03 * a11,
		b05 = a02 * a13 - a03 * a12,
		b06 = a20 * a31 - a21 * a30,
		b07 = a20 * a32 - a22 * a30,
		b08 = a20 * a33 - a23 * a30,
		b09 = a21 * a32 - a22 * a31,
		b10 = a21 * a33 - a23 * a31,
		b11 = a22 * a33 - a23 * a32,
		// calculate the determinant
		d = b00 * b11 -
			b01 * b10 +
			b02 * b09 +
			b03 * b08 -
			b04 * b07 +
			b05 * b06

	if (!d) {
		return null
	}

	d = 1.0 / d

	out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d
	out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d
	out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d
	out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d
	out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d
	out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d
	out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d
	out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d
	out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d
	out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d
	out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d
	out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d
	out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d
	out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d
	out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d
	out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d
}

// from https://github.com/toji/gl-matrix
function multiply(out, a, b) {
	var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
		a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
		a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
		a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

	// cache only the current line of the second matrix
	var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3]
	out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33

	b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7]
	out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33

	b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11]
	out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33

	b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15]
	out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33
}

// from https://github.com/toji/gl-matrix
function rotate(out, a, rad, x, y, z) {
	var len = M.sqrt(x * x + y * y + z * z),
		s, c, t,
		a00, a01, a02, a03,
		a10, a11, a12, a13,
		a20, a21, a22, a23,
		b00, b01, b02,
		b10, b11, b12,
		b20, b21, b22

	if (M.abs(len) < 0.000001) {
		return
	}

	len = 1 / len
	x *= len
	y *= len
	z *= len

	s = M.sin(rad)
	c = M.cos(rad)
	t = 1 - c

	a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3]
	a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7]
	a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11]

	// construct the elements of the rotation matrix
	b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s
	b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s
	b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c

	// perform rotation-specific matrix multiplication
	out[0] = a00 * b00 + a10 * b01 + a20 * b02
	out[1] = a01 * b00 + a11 * b01 + a21 * b02
	out[2] = a02 * b00 + a12 * b01 + a22 * b02
	out[3] = a03 * b00 + a13 * b01 + a23 * b02
	out[4] = a00 * b10 + a10 * b11 + a20 * b12
	out[5] = a01 * b10 + a11 * b11 + a21 * b12
	out[6] = a02 * b10 + a12 * b11 + a22 * b12
	out[7] = a03 * b10 + a13 * b11 + a23 * b12
	out[8] = a00 * b20 + a10 * b21 + a20 * b22
	out[9] = a01 * b20 + a11 * b21 + a21 * b22
	out[10] = a02 * b20 + a12 * b21 + a22 * b22
	out[11] = a03 * b20 + a13 * b21 + a23 * b22

	if (a !== out) {
		// if the source and destination differ, copy the unchanged last row
		out[12] = a[12]
		out[13] = a[13]
		out[14] = a[14]
		out[15] = a[15]
	}
}

// from https://github.com/toji/gl-matrix
function scale(out, a, x, y, z) {
	out[0] = a[0] * x
	out[1] = a[1] * x
	out[2] = a[2] * x
	out[3] = a[3] * x
	out[4] = a[4] * y
	out[5] = a[5] * y
	out[6] = a[6] * y
	out[7] = a[7] * y
	out[8] = a[8] * z
	out[9] = a[9] * z
	out[10] = a[10] * z
	out[11] = a[11] * z
	out[12] = a[12]
	out[13] = a[13]
	out[14] = a[14]
	out[15] = a[15]
}

// from https://github.com/toji/gl-matrix
function translate(out, a, x, y, z) {
	if (a === out) {
		out[12] = a[0] * x + a[4] * y + a[8] * z + a[12]
		out[13] = a[1] * x + a[5] * y + a[9] * z + a[13]
		out[14] = a[2] * x + a[6] * y + a[10] * z + a[14]
		out[15] = a[3] * x + a[7] * y + a[11] * z + a[15]
	} else {
		var a00, a01, a02, a03,
			a10, a11, a12, a13,
			a20, a21, a22, a23

		a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3]
		a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7]
		a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11]

		out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03
		out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13
		out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23

		out[12] = a00 * x + a10 * y + a20 * z + a[12]
		out[13] = a01 * x + a11 * y + a21 * z + a[13]
		out[14] = a02 * x + a12 * y + a22 * z + a[14]
		out[15] = a03 * x + a13 * y + a23 * z + a[15]
	}
}

function drawModel(mm, model, uniforms, color) {
	multiply(m, vm, mm)
	multiply(m, pm, m)

	gl.uniformMatrix4fv(uniforms.mvp, gl.FALSE, m)
	gl.uniformMatrix4fv(uniforms.mm, gl.FALSE, mm)
	gl.uniform4fv(uniforms.color, color)

	gl.drawElements(
		gl.TRIANGLES,
		model.numberOfVertices,
		gl.UNSIGNED_SHORT,
		0)
}

function bindModel(attribs, model) {
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
	gl.vertexAttribPointer(
		attribs.vertex,
		3,
		gl.FLOAT,
		gl.FALSE,
		0,
		0)
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normals)
	gl.vertexAttribPointer(
		attribs.normal,
		3,
		gl.FLOAT,
		gl.FALSE,
		0,
		0)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indicies)
}

function destruct(that) {
	if (!that.show) {
		return
	}
	that.show = false
	for (var pieces = 6, i = debrisLength + debrisStart;
			i-- > debrisStart;) {
		var e = entities[i]
		if (!e.show) {
			var tm = that.matrix,
				em = e.matrix,
				s = .1 + M.random() * .2
			translate(em, im, tm[12], tm[13], tm[14])
			e.rot.x = M.random()
			e.rot.y = M.random()
			e.rot.z = M.random()
			rotate(em, em, M.random() * M.TAU,
				e.rot.x,
				e.rot.y,
				e.rot.z)
			scale(em, em, s, s, s)
			e.vel.x = (M.random() - .5) * .1
			e.vel.y = (M.random() - .8) * .1
			e.vel.z = M.random() * -.1
			e.rot.a = M.random() * .001
			e.show = true
			e.hideAt = now + 2000
			if (--pieces < 1) {
				return
			}
		}
	}
}

function sqDist(a, b) {
	var dx = a[12] - b[12],
		dy = a[13] - b[13],
		dz = a[14] - b[14]
	return dx*dx + dy*dy + dz*dz
}

function flyTo(out, view, x, y, z, w) {
	invert(m, view)
	var vx = m[0] * x + m[4] * y + m[8] * z + m[12] * w,
		vy = m[1] * x + m[5] * y + m[9] * z + m[13] * w,
		vz = m[2] * x + m[6] * y + m[10] * z + m[14] * w,
		roll = M.PI2 - M.atan2(vy, vx),
		pitch = M.atan2(M.sqrt(vx * vx + vy * vy), -vz)

	rotate(out, out, roll * -.01 * factor, 0, 0, 1)
	rotate(out, out, pitch * .01 * factor, 1, 0, 0)
	return pitch
}

function fire(from) {
	if (from.reloadingUntil > now) {
		return
	}
	for (var i = bulletsLength + bulletsStart; i-- > bulletsStart;) {
		var e = entities[i]
		if (!e.show) {
			translate(e.matrix, from.matrix, 0, 0, -3.5)
			e.vel.x = 0
			e.vel.y = 0
			e.vel.z = -1.5
			e.show = true
			e.hideAt = now + 2000
			from.reloadingUntil = now + 100
			return
		}
	}
}

function plot(e, p, px, py, pz, pw) {
	var em = e.matrix,
		v = e.vel,
		r = e.rot

	if (e.attack && player.show) {
		var y = em[13]
		if (y < 5) {
			destruct(e)
			return
		} else if (y < 20) {
			flyTo(em, em, 0, 100, 0, 1)
		} else {
			var pitch = flyTo(em, em, px, py, pz, pw)
			if (sqDist(em, p) < 10000 && pitch < .25) {
				fire(e)
			}
		}
	}

	translate(em, em,
		v.x * factor,
		v.y * factor,
		v.z * factor)

	if (r) {
		rotate(em, em, r.a, r.x, r.y, r.z)
	}
}

function draw() {
	var p = player.matrix,
		px = p[12],
		py = p[13],
		pz = p[14],
		pw = p[15],
		sc,
		gc

	if (py > 0) {
		sc = sky
		gc = colorGreen
	} else {
		sc = invertedSky
		gc = colorRed
	}

	gl.clearColor(sc[0], sc[1], sc[2], sc[3])
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.useProgram(program)

	var uniforms = program.uniforms,
		attribs = program.attribs

	gl.uniform3fv(uniforms.light, light)
	gl.uniform4fv(uniforms.sky, sc)
	gl.uniform1f(uniforms.brightness, brightness)
	gl.uniform1f(uniforms.far, far)

	for (var model, i = entitiesLength; i--;) {
		var e = entities[i]
		if (!e.show) {
			continue
		}
		if (model != e.model) {
			model = e.model
			bindModel(attribs, model)
		}
		drawModel(e.matrix, model, uniforms, i == 0 ? gc : e.color)
		var h = e.hideAt
		if (h > 0 && h < now) {
			e.show = false
		} else if (e !== player && e.vel) {
			// do this here for the next frame to not have
			// to go through all entities again in that frame
			plot(e, p, px, py, pz, pw)
		}
	}
}

function checkHits() {
	for (var i = bulletsLength + bulletsStart; i-- > bulletsStart;) {
		var bullet = entities[i]
		if (!bullet.show) {
			continue
		}
		var bm = bullet.matrix,
			bx = bm[12],
			by = bm[13],
			bz = bm[14]
		for (var j = jetsLength + jetsStart; j-- > jetsStart;) {
			var jet = entities[j]
			if (!jet.show) {
				continue
			}
			var jm = jet.matrix,
				jx = jm[12],
				jy = jm[13],
				jz = jm[14]
			if (M.abs(bx - jx) < 1 &&
				M.abs(by - jy) < 1 &&
				M.abs(bz - jz) < 1) {
				destruct(bullet)
				destruct(jet)
			}
		}
	}
}

function updatePose() {
	var p = player.matrix,
		pv = player.pitchValue,
		pd = player.pitch - pv,
		yv = player.yawValue,
		yd = player.yaw - yv,
		rv = player.rollValue,
		rd = player.roll - rv

	translate(p, cm, 0, 0, -4)
	if (M.abs(rd) > .0001) {
		player.rollValue += rd * .1 * factor
		rotate(p, p, player.rollValue, 0, 0, 1)
	}
	if (M.abs(yd) > .0001) {
		player.yawValue += vd * .1 * factor
		rotate(p, p, player.yawValue, 0, 1, 0)
	}
	if (M.abs(pd) > .0001) {
		player.pitchValue += pd * .1 * factor
		rotate(p, p, player.pitchValue, 1, 0, 0)
	}
}

function turn(rad, x, y, z) {
	rotate(m, im, rad, x, y, z)
	multiply(vm, m, vm)
	var mag = -20
	if (x !== 0) { player.pitch = rad * mag }
	if (y !== 0) { player.yaw = rad * mag }
	if (z !== 0) { player.roll = rad * mag }
}

function input() {
	if (!player.show) {
		return
	}

	var step = .05 * factor

	if (keysDown[87]) {
		player.speed = M.min(player.speed + step, .6)
	} else if (keysDown[83]) {
		player.speed = M.max(player.speed - step, .2)
	}

	translate(m, im, 0, 0, player.speed)
	multiply(vm, m, vm)

	step = (.025 - (.015 / .4 * (player.speed - .2))) * factor
	player.pitch = player.yaw = player.roll = 0

	if (pointersLength > 0) {
		var px = pointersX[0],
			py = pointersY[0]

		if (px < -.5) {
			turn(-step, 0, 0, 1)
		} else if (px > .5) {
			turn(step, 0, 0, 1)
		}

		if (py < -.5) {
			turn(-step, 1, 0, 0)
		} else if (py > .5) {
			turn(step / 4, 1, 0, 0)
		}
	} else {
		if (keysDown[37]) {
			turn(-step, 0, 0, 1)
		} else if (keysDown[39]) {
			turn(step, 0, 0, 1)
		}

		if (keysDown[38]) {
			turn(step / 4, 1, 0, 0)
		} else if (keysDown[40]) {
			turn(-step, 1, 0, 0)
		}
	}

	invert(cm, vm)
	updatePose()
	checkHits()

	// And here's the glitch:
	// Take a break by getting to the "other" side by flying
	// through the ground when firing. But remember to keep
	// on firing to stay alive on the other side.
	var y = player.matrix[13]
	if (keysDown[32] || pointersLength > 1) {
		if (y > 5) {
			fire(player)
		}
	} else if (y < 5) {
		destruct(player)
	}
}

function run() {
	requestAnimationFrame(run)

	now = Date.now()
	factor = (now - last) / 16
	last = now

	input()
	draw()
}

function setPointer(event, down) {
	if (!down) {
		pointersLength = event.touches ? event.touches.length : 0
	} else if (event.touches) {
		var touches = event.touches
		pointersLength = touches.length

		for (var i = pointersLength; i--;) {
			var t = touches[i]
			pointersX[i] = t.pageX
			pointersY[i] = t.pageY
		}
	} else {
		pointersLength = 1
		pointersX[0] = event.pageX
		pointersY[0] = event.pageY
	}

	if (down) {
		// map to WebGL coordinates
		var xf = 2 / width,
			yf = 2 / height

		for (var i = pointersLength; i--;) {
			pointersX[i] = pointersX[i] * xf - 1
			pointersY[i] = -(pointersY[i] * yf - 1)
		}
	}

	event.preventDefault()
}

function pointerUp(event) {
	setPointer(event, false)
}

function pointerMove(event) {
	setPointer(event, pointersLength)
}

function pointerDown(event) {
	setPointer(event, true)
}

function setKey(event, down) {
	keysDown[event.keyCode] = down
	event.preventDefault()
}

function keyUp(event) {
	setKey(event, false)
}

function keyDown(event) {
	setKey(event, true)
}

function resize() {
	width = gl.canvas.clientWidth
	height = gl.canvas.clientHeight

	gl.canvas.width = width
	gl.canvas.height = height
	gl.viewport(0, 0, width, height)

	var aspect = width / height,
		near = .1,
		r = near - far,
		f = 1 / M.tan(M.PI * .125)

	pm = new FA([
		f / aspect, 0, 0, 0,
		0, f, 0, 0,
		0, 0, (far + near) / r, -1,
		0, 0, (2 * far * near) / r, 0])

	invert(cm, vm)
}

function cacheUniformLocations(program, uniforms) {
	if (program.uniforms === undefined) {
		program.uniforms = {}
	}
	for (var i = 0, l = uniforms.length; i < l; ++i) {
		var name = uniforms[i]
		program.uniforms[name] = gl.getUniformLocation(program, name)
	}
}

function cacheAttribLocations(program, attribs) {
	if (program.attribs === undefined) {
		program.attribs = {}
	}
	for (var i = 0, l = attribs.length; i < l; ++i) {
		var name = attribs[i]
		program.attribs[name] = gl.getAttribLocation(program, name)
		gl.enableVertexAttribArray(program.attribs[name])
	}
}

function compileShader(src, type) {
	var shader = gl.createShader(type)

	gl.shaderSource(shader, src)
	gl.compileShader(shader)

	return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ?
		shader :
		null
}

function linkProgram(vs, fs) {
	var p
	if ((p = gl.createProgram())) {
		gl.attachShader(p, vs)
		gl.attachShader(p, fs)
		gl.linkProgram(p)

		if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
			gl.deleteProgram(p)
			p = null
		}
	}

	return p
}

function buildProgram(vertexSource, fragmentSource) {
	var p, vs, fs
	if ((vs = compileShader(vertexSource, gl.VERTEX_SHADER))) {
		if ((fs = compileShader(fragmentSource, gl.FRAGMENT_SHADER))) {
			p = linkProgram(vs, fs)
			gl.deleteShader(fs)
		}

		gl.deleteShader(vs)
	}

	return p
}

function calculateNormals(vertices, indicies) {
	var normals = []

	for (var i = 0, l = indicies.length; i < l;) {
		var a = indicies[i++] * 3,
			b = indicies[i++] * 3,
			c = indicies[i++] * 3,
			x1 = vertices[a],
			y1 = vertices[a + 1],
			z1 = vertices[a + 2],
			x2 = vertices[b],
			y2 = vertices[b + 1],
			z2 = vertices[b + 2],
			x3 = vertices[c],
			y3 = vertices[c + 1],
			z3 = vertices[c + 2],
			ux = x2 - x1,
			uy = y2 - y1,
			uz = z2 - z1,
			vx = x3 - x1,
			vy = y3 - y1,
			vz = z3 - z1,
			nx = uy * vz - uz * vy,
			ny = uz * vx - ux * vz,
			nz = ux * vy - uy * vx

		normals[a] = nx
		normals[a + 1] = ny
		normals[a + 2] = nz

		normals[b] = nx
		normals[b + 1] = ny
		normals[b + 2] = nz

		normals[c] = nx
		normals[c + 1] = ny
		normals[c + 2] = nz
	}

	return normals
}

function createModel(vertices, indicies) {
	var model = {numberOfVertices: indicies.length}

	model.vertices = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
	gl.bufferData(gl.ARRAY_BUFFER,
		new FA(vertices),
		gl.STATIC_DRAW)

	model.normals = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normals)
	gl.bufferData(gl.ARRAY_BUFFER,
		new FA(calculateNormals(vertices, indicies)),
		gl.STATIC_DRAW)

	model.indicies = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indicies)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(indicies),
		gl.STATIC_DRAW)

	return model
}

function createTriangle() {
	return createModel([
		0, 1, 0,
		-1, -1, 0,
		1, -1, 0],[
		0, 1, 2])
}

function createPlane() {
	return createModel([
		-1, 1, 0,
		-1, -1, 0,
		1, 1, 0,
		1, -1, 0],[
		0, 2, 1,
		2, 3, 1])
}

function createBullet() {
	return createModel([
		0, .05, 0,
		.05, 0, 0,
		0, -.05, 0,
		-.05, 0, 0,
		0, 0, .7],[
		0, 1, 2,
		2, 3, 0,
		0, 4, 1,
		1, 4, 2,
		2, 4, 3,
		3, 4, 0])
}

function createJet() {
	var vertices = [
		0.160713, -0.079566, 0.308486,
		0.160713, -0.035350, 0.308486,
		0.141574, -0.076788, -0.428799,
		0.141574, -0.038128, -0.428799,
		0.044415, -0.064979, -1.002609,
		0.044415, -0.054442, -1.002609,
		0.137133, -0.071677, 0.561634,
		0.137133, -0.043239, 0.561634,
		0.734764, -0.066573, 0.275790,
		0.734764, -0.048343, 0.275790,
		0.710531, -0.065557, 0.126651,
		0.710531, -0.049359, 0.126651,
		0.111385, -0.068833, 0.814783,
		0.111385, -0.046083, 0.814783,
		0.437837, -0.065587, 0.793524,
		0.437837, -0.049329, 0.793524,
		0.447748, -0.063962, 0.866828,
		0.447748, -0.050954, 0.866828,
		0.106927, 0.058309, 0.300239,
		0.094546, 0.014669, -0.585247,
		0.031598, -0.024898, -1.004654,
		0.091673, 0.053199, 0.546369,
		0.075369, 0.022490, 0.821219,
		0.093902, -0.173471, 0.293002,
		0.082845, -0.144193, -0.525104,
		0.027693, -0.115441, -0.981081,
		0.016848, 0.075065, 0.336714,
		0.080280, -0.157591, 0.554191,
		0.064380, -0.134058, 0.818955,
		0.030287, 0.072383, 0.652842,
		0.026017, 0.056262, 0.851769,
		0.003935, 0.431639, 0.625258,
		0.007840, 0.428957, 0.776011,
		0.005930, 0.412836, 0.826948,
		0.060856, 0.023202, -0.536708,
		0.068396, 0.049776, -0.193999,
		0.029756, 0.084168, -0.426948,
		0.032827, 0.085887, -0.321909,
		0.039074, -0.044549, -0.145049,
		0.039074, -0.037679, -0.145049,
		0.028199, -0.016973, -0.143105,
		0.024880, -0.064244, -0.143789,
		0.013297, -0.006776, -0.133881,
		0.044415, -0.064979, -1.002609,
		0.044415, -0.054442, -1.002609,
		0.031598, -0.024898, -1.004654,
		0.027693, -0.115441, -0.981081,
		0.026041, -0.064593, -0.249896,
		0.026041, -0.058611, -0.249896,
		0.018764, -0.041837, -0.240374,
		0.016547, -0.093244, -0.237674,
		0, -0.144193, -0.525104,
		0, 0.085887, -0.321909,
		0, -0.115441, -0.981081,
		0, -0.006776, -0.133881,
		0, -0.041837, -0.240374,
		0, 0.058309, 0.300239,
		0, -0.134058, 0.818955,
		0, 0.412836, 0.826948,
		0, 0.049776, -0.193999,
		0, 0.056262, 0.851769,
		0, 0.084168, -0.426948,
		0, -0.024898, -1.004654,
		0, -0.173471, 0.293002,
		0, 0.075065, 0.336714,
		0, 0.428957, 0.776011,
		0, -0.064244, -0.143789,
		0, 0.014669, -0.585247,
		0, 0.023202, -0.536708,
		0, -0.157591, 0.554191,
		0, 0.431639, 0.625258,
		0, -0.024898, -1.004654,
		0, -0.093244, -0.237674,
		0, -0.115441, -0.981081,
	], indicies = [
		0, 10, 8,
		20, 44, 45,
		6, 28, 27,
		5, 43, 44,
		4, 24, 25,
		1, 21, 7,
		1, 11, 3,
		7, 22, 13,
		10, 9, 8,
		0, 9, 1,
		7, 0, 1,
		10, 3, 11,
		5, 2, 4,
		7, 14, 6,
		15, 16, 14,
		12, 14, 16,
		12, 17, 13,
		13, 15, 7,
		67, 34, 19,
		22, 29, 30,
		3, 18, 1,
		5, 19, 3,
		24, 63, 51,
		51, 25, 24,
		0, 27, 23,
		2, 23, 24,
		73, 50, 46,
		29, 31, 32,
		22, 42, 40,
		21, 26, 29,
		56, 26, 18,
		65, 33, 32,
		31, 65, 32,
		64, 31, 26,
		29, 33, 30,
		19, 35, 18,
		68, 36, 34,
		34, 37, 35,
		12, 41, 28,
		13, 40, 39,
		13, 38, 12,
		60, 42, 30,
		40, 54, 66,
		4, 46, 43,
		25, 73, 46,
		46, 47, 43,
		45, 48, 49,
		43, 48, 44,
		52, 36, 61,
		67, 20, 71,
		63, 27, 69,
		60, 33, 58,
		56, 35, 59,
		59, 37, 52,
		57, 41, 66,
		69, 28, 57,
		62, 49, 55,
		0, 2, 10,
		20, 5, 44,
		6, 12, 28,
		5, 4, 43,
		4, 2, 24,
		1, 18, 21,
		1, 9, 11,
		7, 21, 22,
		10, 11, 9,
		0, 8, 9,
		7, 6, 0,
		10, 2, 3,
		5, 3, 2,
		7, 15, 14,
		15, 17, 16,
		12, 6, 14,
		12, 16, 17,
		13, 17, 15,
		67, 68, 34,
		22, 21, 29,
		3, 19, 18,
		5, 20, 19,
		24, 23, 63,
		51, 53, 25,
		0, 6, 27,
		2, 0, 23,
		73, 72, 50,
		29, 26, 31,
		22, 30, 42,
		21, 18, 26,
		56, 64, 26,
		65, 58, 33,
		31, 70, 65,
		64, 70, 31,
		29, 32, 33,
		19, 34, 35,
		68, 61, 36,
		34, 36, 37,
		12, 38, 41,
		13, 22, 40,
		13, 39, 38,
		60, 54, 42,
		41, 38, 39,
		39, 40, 66,
		42, 54, 40,
		66, 41, 39,
		4, 25, 46,
		25, 53, 73,
		46, 50, 47,
		45, 44, 48,
		43, 47, 48,
		52, 37, 36,
		67, 19, 20,
		63, 23, 27,
		60, 30, 33,
		56, 18, 35,
		59, 35, 37,
		57, 28, 41,
		69, 27, 28,
		62, 45, 49,
	]

	var n = vertices.length / 3
	for (var i = 0, l = vertices.length; i < l;) {
		vertices.push(-vertices[i++])
		vertices.push(vertices[i++])
		vertices.push(vertices[i++])
	}

	for (var i = 0, l = indicies.length; i < l; i += 3) {
		indicies.push(n + indicies[i + 2])
		indicies.push(n + indicies[i + 1])
		indicies.push(n + indicies[i])
	}

	return createModel(vertices, indicies)
}

function createGround() {
	var vertices = [],
		indicies = [],
		radius = 50

	for (var y = 0, z = -radius; z < radius; ++z) {
		for (var x = -radius; x < radius; ++x) {
			vertices.push(x + (M.random() - .5) * .5)
			vertices.push(y + (M.random() - .5) * 10)
			vertices.push(z + (M.random() - .5) * .5)
		}
	}

	// I want to have that 90's look with hard sharp seams and the
	// only way to get that in WebGL is not to reuse vertices so they
	// don't share a normal
	var v = []
	for (var i = 0, size = radius * 2, z = -radius,
			order = [0, 1, size, 1, size + 1, size],
			ze = radius - 1; z < ze; ++z) {
		for (var x = -radius, xe = radius - 1; x < xe; ++x) {
			for (var j = 0; j < 6; ++j) {
				var offset = (order[j] + i) * 3
				v.push(vertices[offset])
				v.push(vertices[offset + 1])
				v.push(vertices[offset + 2])
			}
			++i
		}
		++i
	}

	for (var i = 0, l = v.length / 3; i < l; ++i) {
		indicies.push(i)
	}

	return createModel(v, indicies)
}

function createObjects() {
	var ground = createGround(),
		jet = createJet(),
		bullet = createBullet(),
		plane = createPlane(),
		tri = createTriangle(),
		offsetHeight = 100

	scale(m, im, 30, 1, 30)
	entities.push({
		show: true,
		model: ground,
		matrix: new FA(m),
		color: colorGreen})

	bulletsStart = entities.length
	bulletsLength = 10
	rotate(m, im, M.PI2, 1, 0, 0)
	scale(m, m, .1, .1, .2)
	for (var i = bulletsLength; i--;) {
		entities.push({
			show: false,
			model: bullet,
			matrix: new FA(m),
			color: colorRed,
			vel: {}
		})
	}

	debrisStart = entities.length
	debrisLength = 100
	for (var i = debrisLength; i--;) {
		entities.push({
			show: false,
			model: tri,
			matrix: new FA(im),
			color: colorWhite,
			vel: {},
			rot: {},
		})
	}

	jetsStart = entities.length
	for (var i = 10; i--;) {
		var x = M.random() * 20 - 10,
			y = (M.random() * 10 - 5) + offsetHeight
		if (x < 0) { x -= 5 } else { x += 5 }
		if (y < 0) { y -= 5 } else { y += 5 }
		translate(m, im, x, y, (i + 1) * -10)
		rotate(m, m, M.random() * M.TAU, M.random(), M.random(), M.random())
		entities.push({
			show: true,
			attack: true,
			model: jet,
			matrix: new FA(m),
			color: colorRed,
			vel: {x: 0, y: 0, z: -.2 - M.random() * .2},
		})
	}

	translate(vm, vm, 0, -offsetHeight, 0)
	entities.push((player = {
		show: true,
		model: jet,
		matrix: new FA(m),
		color: colorWhite,
		speed: .2,
		pitchValue: 0,
		yawValue: 0,
		rollValue: 0,
	}))
	jetsLength = entities.length - jetsStart

	entitiesLength = entities.length
}

function getContext() {
	for (var canvas = D.getElementById('Canvas'),
			ctx,
			types = ['webgl', 'experimental-webgl'],
			l = types.length,
			i = 0; i < l; ++i) {
		if ((ctx = canvas.getContext(types[i], {alpha: false}))) {
			return ctx
		}
	}
}

function init() {
	if (!(gl = getContext()) || !(program = buildProgram(
			D.getElementById('VertexShader').textContent,
			D.getElementById('FragmentShader').textContent))) {
		alert('WebGL not available')
		return
	}

	createObjects()
	cacheAttribLocations(program, [
		'vertex',
		'normal'])
	cacheUniformLocations(program, [
		'mvp',
		'mm',
		'light',
		'color',
		'sky',
		'brightness',
		'far'])

	gl.enable(gl.DEPTH_TEST)
	gl.clearColor(sky[0], sky[1], sky[2], sky[3])

	W.onresize = resize
	resize()

	D.onkeydown = keyDown
	D.onkeyup = keyUp

	D.onmousedown = pointerDown
	D.onmousemove = pointerMove
	D.onmouseup = pointerUp
	D.onmouseout = pointerUp

	if ('ontouchstart' in D) {
		D.ontouchstart = pointerDown
		D.ontouchmove = pointerMove
		D.ontouchend = pointerUp
		D.ontouchleave = pointerUp
		D.ontouchcancel = pointerUp
	}

	last = Date.now() - 16
	run()
}

W.onload = init
