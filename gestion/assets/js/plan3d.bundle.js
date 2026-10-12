/*! Vue 3D du Plan : bundle généré par tools/plan3d (npm run build) — ne pas modifier à la main.
 * Contient Three.js r186 (0.186.1), licence MIT :
 *
 * The MIT License
 * 
 * Copyright © 2010-2026 three.js authors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(()=>{var Eh=0,Cl=1,Th=2;var bi=1,Ah=2,ss=3,oi=0,Xt=1,ln=2,In=0,rs=1,Rl=2,Il=3,Pl=4,Ch=5;var Si=100,Rh=101,Ih=102,Ph=103,Lh=104,Dh=200,Nh=201,Uh=202,Fh=203,Ll=204,Dl=205,Oh=206,Bh=207,zh=208,Vh=209,Gh=210,kh=211,Hh=212,Wh=213,Xh=214,Zr=0,Jr=1,$r=2,qi=3,Kr=4,jr=5,Qr=6,ea=7,Pa=0,qh=1,Yh=2,_n=0,Nl=1,Ul=2,Fl=3,Ol=4,Bl=5,zl=6,Vl=7;var Gl=300,li=301,wi=302,La=303,Da=304,rr=306,_i=1e3,tn=1001,ta=1002,Dt=1003,Zh=1004;var ar=1005;var Rt=1006,Na=1007;var Pn=1008;var Kt=1009,kl=1010,Hl=1011,as=1012,Ua=1013,vn=1014,cn=1015,yn=1016,Fa=1017,Oa=1018,os=1020,Wl=35902,Xl=35899,ql=1021,Yl=1022,hn=1023,Tn=1026,ci=1027,Ba=1028,za=1029,hi=1030,Va=1031;var Ga=1033,or=33776,lr=33777,cr=33778,hr=33779,ka=35840,Ha=35841,Wa=35842,Xa=35843,qa=36196,Ya=37492,Za=37496,Ja=37488,$a=37489,ur=37490,Ka=37491,ja=37808,Qa=37809,eo=37810,to=37811,no=37812,io=37813,so=37814,ro=37815,ao=37816,oo=37817,lo=37818,co=37819,ho=37820,uo=37821,fo=36492,po=36494,mo=36495,go=36283,xo=36284,fr=36285,_o=36286;var Rs=2300,na=2301,qr=2302,gl=2303,xl=2400,_l=2401,vl=2402;var Jh=3200;var vo=0,$h=1,Wn="",Ct="srgb",Is="srgb-linear",Ps="linear",ot="srgb";var Yr=7680;var Kh=519,jh=512,Qh=513,eu=514,yo=515,tu=516,nu=517,Mo=518,iu=519,su=35044;var Zl="300 es",mn=2e3,Yi=2001;function Gf(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function kf(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Ls(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function ru(){let s=Ls("canvas");return s.style.display="block",s}var Zc={},Zi=null;function Jl(...s){let e="THREE."+s.shift();Zi?Zi("log",e,...s):console.log(e,...s)}function au(s){let e=s[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=s[1];t&&t.isStackTrace?s[0]+=" "+t.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function Oe(...s){s=au(s);let e="THREE."+s.shift();if(Zi)Zi("warn",e,...s);else{let t=s[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...s)}}function Fe(...s){s=au(s);let e="THREE."+s.shift();if(Zi)Zi("error",e,...s);else{let t=s[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...s)}}function xi(...s){let e=s.join(" ");e in Zc||(Zc[e]=!0,Oe(...s))}function ou(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var lu={[Zr]:Jr,[$r]:Qr,[Kr]:ea,[qi]:jr,[Jr]:Zr,[Qr]:$r,[ea]:Kr,[jr]:qi},An=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,e);e.target=null}}},Bt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Wo=Math.PI/180,ia=180/Math.PI;function ls(){let s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Bt[s&255]+Bt[s>>8&255]+Bt[s>>16&255]+Bt[s>>24&255]+"-"+Bt[e&255]+Bt[e>>8&255]+"-"+Bt[e>>16&15|64]+Bt[e>>24&255]+"-"+Bt[t&63|128]+Bt[t>>8&255]+"-"+Bt[t>>16&255]+Bt[t>>24&255]+Bt[n&255]+Bt[n>>8&255]+Bt[n>>16&255]+Bt[n>>24&255]).toLowerCase()}function Je(s,e,t){return Math.max(e,Math.min(t,s))}function Hf(s,e){return(s%e+e)%e}function Xo(s,e,t){return(1-t)*s+t*e}function vs(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:case Uint8ClampedArray:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Zt(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var tc=class tc{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*i+e.x,this.y=r*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};tc.prototype.isVector2=!0;var oe=tc,Nt=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,a,o){let l=n[i+0],c=n[i+1],u=n[i+2],h=n[i+3],f=r[a+0],d=r[a+1],g=r[a+2],x=r[a+3];if(h!==x||l!==f||c!==d||u!==g){let p=l*f+c*d+u*g+h*x;p<0&&(f=-f,d=-d,g=-g,x=-x,p=-p);let m=1-o;if(p<.9995){let M=Math.acos(p),E=Math.sin(M);m=Math.sin(m*M)/E,o=Math.sin(o*M)/E,l=l*m+f*o,c=c*m+d*o,u=u*m+g*o,h=h*m+x*o}else{l=l*m+f*o,c=c*m+d*o,u=u*m+g*o,h=h*m+x*o;let M=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=M,c*=M,u*=M,h*=M}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,r,a){let o=n[i],l=n[i+1],c=n[i+2],u=n[i+3],h=r[a],f=r[a+1],d=r[a+2],g=r[a+3];return e[t]=o*g+u*h+l*d-c*f,e[t+1]=l*g+u*f+c*h-o*d,e[t+2]=c*g+u*d+o*f-l*h,e[t+3]=u*g-o*h-l*f-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(i/2),h=o(r/2),f=l(n/2),d=l(i/2),g=l(r/2);switch(a){case"XYZ":this._x=f*u*h+c*d*g,this._y=c*d*h-f*u*g,this._z=c*u*g+f*d*h,this._w=c*u*h-f*d*g;break;case"YXZ":this._x=f*u*h+c*d*g,this._y=c*d*h-f*u*g,this._z=c*u*g-f*d*h,this._w=c*u*h+f*d*g;break;case"ZXY":this._x=f*u*h-c*d*g,this._y=c*d*h+f*u*g,this._z=c*u*g+f*d*h,this._w=c*u*h-f*d*g;break;case"ZYX":this._x=f*u*h-c*d*g,this._y=c*d*h+f*u*g,this._z=c*u*g-f*d*h,this._w=c*u*h+f*d*g;break;case"YZX":this._x=f*u*h+c*d*g,this._y=c*d*h+f*u*g,this._z=c*u*g-f*d*h,this._w=c*u*h-f*d*g;break;case"XZY":this._x=f*u*h-c*d*g,this._y=c*d*h-f*u*g,this._z=c*u*g+f*d*h,this._w=c*u*h+f*d*g;break;default:Oe("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],u=t[6],h=t[10],f=n+o+h;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(u-l)*d,this._y=(r-c)*d,this._z=(a-i)*d}else if(n>o&&n>h){let d=2*Math.sqrt(1+n-o-h);this._w=(u-l)/d,this._x=.25*d,this._y=(i+a)/d,this._z=(r+c)/d}else if(o>h){let d=2*Math.sqrt(1+o-n-h);this._w=(r-c)/d,this._x=(i+a)/d,this._y=.25*d,this._z=(l+u)/d}else{let d=2*Math.sqrt(1+h-n-o);this._w=(a-i)/d,this._x=(r+c)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Je(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+a*o+i*c-r*l,this._y=i*u+a*l+r*o-n*c,this._z=r*u+a*c+n*l-i*o,this._w=a*u-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,i=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,i=-i,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},nc=class nc{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Jc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Jc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),u=2*(o*t-r*i),h=2*(r*n-a*t);return this.x=t+l*c+a*h-o*u,this.y=n+l*u+o*c-r*h,this.z=i+l*h+r*u-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return qo.copy(this).projectOnVector(e),this.sub(qo)}reflect(e){return this.sub(qo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};nc.prototype.isVector3=!0;var D=nc,qo=new D,Jc=new Nt,ic=class ic{constructor(e,t,n,i,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c)}set(e,t,n,i,r,a,o,l,c){let u=this.elements;return u[0]=e,u[1]=i,u[2]=o,u[3]=t,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],h=n[7],f=n[2],d=n[5],g=n[8],x=i[0],p=i[3],m=i[6],M=i[1],E=i[4],y=i[7],b=i[2],w=i[5],A=i[8];return r[0]=a*x+o*M+l*b,r[3]=a*p+o*E+l*w,r[6]=a*m+o*y+l*A,r[1]=c*x+u*M+h*b,r[4]=c*p+u*E+h*w,r[7]=c*m+u*y+h*A,r[2]=f*x+d*M+g*b,r[5]=f*p+d*E+g*w,r[8]=f*m+d*y+g*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*a*u-t*o*c-n*r*u+n*o*l+i*r*c-i*a*l}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=u*a-o*c,f=o*l-u*r,d=c*r-a*l,g=t*h+n*f+i*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return e[0]=h*x,e[1]=(i*c-u*n)*x,e[2]=(o*n-i*a)*x,e[3]=f*x,e[4]=(u*t-i*l)*x,e[5]=(i*r-o*t)*x,e[6]=d*x,e[7]=(n*l-c*t)*x,e[8]=(a*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return xi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Yo.makeScale(e,t)),this}rotate(e){return xi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Yo.makeRotation(-e)),this}translate(e,t){return xi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Yo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};ic.prototype.isMatrix3=!0;var ke=ic,Yo=new ke,$c=new ke().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Kc=new ke().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Wf(){let s={enabled:!0,workingColorSpace:Is,spaces:{},convert:function(i,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===ot&&(i.r=Hn(i.r),i.g=Hn(i.g),i.b=Hn(i.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ot&&(i.r=Xi(i.r),i.g=Xi(i.g),i.b=Xi(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Wn?Ps:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,a){return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,r){return xi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(i,r)},toWorkingColorSpace:function(i,r){return xi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(i,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[Is]:{primaries:e,whitePoint:n,transfer:Ps,toXYZ:$c,fromXYZ:Kc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ct},outputColorSpaceConfig:{drawingBufferColorSpace:Ct}},[Ct]:{primaries:e,whitePoint:n,transfer:ot,toXYZ:$c,fromXYZ:Kc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ct}}}),s}var et=Wf();function Hn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Xi(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var Pi,sa=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Pi===void 0&&(Pi=Ls("canvas")),Pi.width=e.width,Pi.height=e.height;let i=Pi.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=Pi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ls("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=Hn(r[a]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Hn(t[n]/255)*255):t[n]=Hn(t[n]);return{data:t,width:e.width,height:e.height}}else return Oe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Xf=0,Ji=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Xf++}),this.uuid=ls(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Zo(i[a].image)):r.push(Zo(i[a]))}else r=Zo(i);n.url=r}return t||(e.images[this.uuid]=n),n}};function Zo(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?sa.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(Oe("Texture: Unable to serialize Texture."),{})}var qf=0,Jo=new D,Wt=class s extends An{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=tn,i=tn,r=Rt,a=Pn,o=hn,l=Kt,c=s.DEFAULT_ANISOTROPY,u=Wn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:qf++}),this.uuid=ls(),this.name="",this.source=new Ji(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new oe(0,0),this.repeat=new oe(1,1),this.center=new oe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Jo).x}get height(){return this.source.getSize(Jo).y}get depth(){return this.source.getSize(Jo).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Oe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Oe(`Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Gl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case _i:e.x=e.x-Math.floor(e.x);break;case tn:e.x=e.x<0?0:1;break;case ta:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case _i:e.y=e.y-Math.floor(e.y);break;case tn:e.y=e.y<0?0:1;break;case ta:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Wt.DEFAULT_IMAGE=null;Wt.DEFAULT_MAPPING=Gl;Wt.DEFAULT_ANISOTROPY=1;var sc=class sc{constructor(e=0,t=0,n=0,i=1){this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,l=e.elements,c=l[0],u=l[4],h=l[8],f=l[1],d=l[5],g=l[9],x=l[2],p=l[6],m=l[10];if(Math.abs(u-f)<.01&&Math.abs(h-x)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+f)<.1&&Math.abs(h+x)<.1&&Math.abs(g+p)<.1&&Math.abs(c+d+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(c+1)/2,y=(d+1)/2,b=(m+1)/2,w=(u+f)/4,A=(h+x)/4,v=(g+p)/4;return E>y&&E>b?E<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(E),i=w/n,r=A/n):y>b?y<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(y),n=w/i,r=v/i):b<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(b),n=A/r,i=v/r),this.set(n,i,r,t),this}let M=Math.sqrt((p-g)*(p-g)+(h-x)*(h-x)+(f-u)*(f-u));return Math.abs(M)<.001&&(M=1),this.x=(p-g)/M,this.y=(h-x)/M,this.z=(f-u)/M,this.w=Math.acos((c+d+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this.w=Je(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this.w=Je(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};sc.prototype.isVector4=!0;var vt=sc,ra=class extends An{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Rt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new vt(0,0,e,t),this.scissorTest=!1,this.viewport=new vt(0,0,e,t),this.textures=[];let i={width:e,height:t,depth:n.depth},r=new Wt(i),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Rt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new Ji(i)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},$t=class extends ra{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Ds=class extends Wt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=tn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var aa=class extends Wt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=tn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Ia=class Ia{constructor(e,t,n,i,r,a,o,l,c,u,h,f,d,g,x,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c,u,h,f,d,g,x,p)}set(e,t,n,i,r,a,o,l,c,u,h,f,d,g,x,p){let m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=i,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=u,m[10]=h,m[14]=f,m[3]=d,m[7]=g,m[11]=x,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ia().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,i=1/Li.setFromMatrixColumn(e,0).length(),r=1/Li.setFromMatrixColumn(e,1).length(),a=1/Li.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){let f=a*u,d=a*h,g=o*u,x=o*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=d+g*c,t[5]=f-x*c,t[9]=-o*l,t[2]=x-f*c,t[6]=g+d*c,t[10]=a*l}else if(e.order==="YXZ"){let f=l*u,d=l*h,g=c*u,x=c*h;t[0]=f+x*o,t[4]=g*o-d,t[8]=a*c,t[1]=a*h,t[5]=a*u,t[9]=-o,t[2]=d*o-g,t[6]=x+f*o,t[10]=a*l}else if(e.order==="ZXY"){let f=l*u,d=l*h,g=c*u,x=c*h;t[0]=f-x*o,t[4]=-a*h,t[8]=g+d*o,t[1]=d+g*o,t[5]=a*u,t[9]=x-f*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let f=a*u,d=a*h,g=o*u,x=o*h;t[0]=l*u,t[4]=g*c-d,t[8]=f*c+x,t[1]=l*h,t[5]=x*c+f,t[9]=d*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let f=a*l,d=a*c,g=o*l,x=o*c;t[0]=l*u,t[4]=x-f*h,t[8]=g*h+d,t[1]=h,t[5]=a*u,t[9]=-o*u,t[2]=-c*u,t[6]=d*h+g,t[10]=f-x*h}else if(e.order==="XZY"){let f=a*l,d=a*c,g=o*l,x=o*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=f*h+x,t[5]=a*u,t[9]=d*h-g,t[2]=g*h-d,t[6]=o*u,t[10]=x*h+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Yf,e,Zf)}lookAt(e,t,n){let i=this.elements;return jt.subVectors(e,t),jt.lengthSq()===0&&(jt.z=1),jt.normalize(),Zn.crossVectors(n,jt),Zn.lengthSq()===0&&(Math.abs(n.z)===1?jt.x+=1e-4:jt.z+=1e-4,jt.normalize(),Zn.crossVectors(n,jt)),Zn.normalize(),wr.crossVectors(jt,Zn),i[0]=Zn.x,i[4]=wr.x,i[8]=jt.x,i[1]=Zn.y,i[5]=wr.y,i[9]=jt.y,i[2]=Zn.z,i[6]=wr.z,i[10]=jt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],h=n[5],f=n[9],d=n[13],g=n[2],x=n[6],p=n[10],m=n[14],M=n[3],E=n[7],y=n[11],b=n[15],w=i[0],A=i[4],v=i[8],T=i[12],R=i[1],I=i[5],U=i[9],L=i[13],P=i[2],F=i[6],O=i[10],G=i[14],Q=i[3],k=i[7],Z=i[11],j=i[15];return r[0]=a*w+o*R+l*P+c*Q,r[4]=a*A+o*I+l*F+c*k,r[8]=a*v+o*U+l*O+c*Z,r[12]=a*T+o*L+l*G+c*j,r[1]=u*w+h*R+f*P+d*Q,r[5]=u*A+h*I+f*F+d*k,r[9]=u*v+h*U+f*O+d*Z,r[13]=u*T+h*L+f*G+d*j,r[2]=g*w+x*R+p*P+m*Q,r[6]=g*A+x*I+p*F+m*k,r[10]=g*v+x*U+p*O+m*Z,r[14]=g*T+x*L+p*G+m*j,r[3]=M*w+E*R+y*P+b*Q,r[7]=M*A+E*I+y*F+b*k,r[11]=M*v+E*U+y*O+b*Z,r[15]=M*T+E*L+y*G+b*j,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],u=e[2],h=e[6],f=e[10],d=e[14],g=e[3],x=e[7],p=e[11],m=e[15],M=l*d-c*f,E=o*d-c*h,y=o*f-l*h,b=a*d-c*u,w=a*f-l*u,A=a*h-o*u;return t*(x*M-p*E+m*y)-n*(g*M-p*b+m*w)+i*(g*E-x*b+m*A)-r*(g*y-x*w+p*A)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],u=e[10];return t*(a*u-o*c)-n*(r*u-o*l)+i*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=e[9],f=e[10],d=e[11],g=e[12],x=e[13],p=e[14],m=e[15],M=t*o-n*a,E=t*l-i*a,y=t*c-r*a,b=n*l-i*o,w=n*c-r*o,A=i*c-r*l,v=u*x-h*g,T=u*p-f*g,R=u*m-d*g,I=h*p-f*x,U=h*m-d*x,L=f*m-d*p,P=M*L-E*U+y*I+b*R-w*T+A*v;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/P;return e[0]=(o*L-l*U+c*I)*F,e[1]=(i*U-n*L-r*I)*F,e[2]=(x*A-p*w+m*b)*F,e[3]=(f*w-h*A-d*b)*F,e[4]=(l*R-a*L-c*T)*F,e[5]=(t*L-i*R+r*T)*F,e[6]=(p*y-g*A-m*E)*F,e[7]=(u*A-f*y+d*E)*F,e[8]=(a*U-o*R+c*v)*F,e[9]=(n*R-t*U-r*v)*F,e[10]=(g*w-x*y+m*M)*F,e[11]=(h*y-u*w-d*M)*F,e[12]=(o*T-a*I-l*v)*F,e[13]=(t*I-n*T+i*v)*F,e[14]=(x*E-g*b-p*M)*F,e[15]=(u*b-h*E+f*M)*F,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,u=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,u*o+n,u*l-i*a,0,c*l-i*o,u*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,a){return this.set(1,n,r,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,u=a+a,h=o+o,f=r*c,d=r*u,g=r*h,x=a*u,p=a*h,m=o*h,M=l*c,E=l*u,y=l*h,b=n.x,w=n.y,A=n.z;return i[0]=(1-(x+m))*b,i[1]=(d+y)*b,i[2]=(g-E)*b,i[3]=0,i[4]=(d-y)*w,i[5]=(1-(f+m))*w,i[6]=(p+M)*w,i[7]=0,i[8]=(g+E)*A,i[9]=(p-M)*A,i[10]=(1-(f+x))*A,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Li.set(i[0],i[1],i[2]).length(),o=Li.set(i[4],i[5],i[6]).length(),l=Li.set(i[8],i[9],i[10]).length();r<0&&(a=-a),fn.copy(this);let c=1/a,u=1/o,h=1/l;return fn.elements[0]*=c,fn.elements[1]*=c,fn.elements[2]*=c,fn.elements[4]*=u,fn.elements[5]*=u,fn.elements[6]*=u,fn.elements[8]*=h,fn.elements[9]*=h,fn.elements[10]*=h,t.setFromRotationMatrix(fn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,i,r,a,o=mn,l=!1){let c=this.elements,u=2*r/(t-e),h=2*r/(n-i),f=(t+e)/(t-e),d=(n+i)/(n-i),g,x;if(l)g=r/(a-r),x=a*r/(a-r);else if(o===mn)g=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===Yi)g=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=h,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,a,o=mn,l=!1){let c=this.elements,u=2/(t-e),h=2/(n-i),f=-(t+e)/(t-e),d=-(n+i)/(n-i),g,x;if(l)g=1/(a-r),x=a/(a-r);else if(o===mn)g=-2/(a-r),x=-(a+r)/(a-r);else if(o===Yi)g=-1/(a-r),x=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=h,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Ia.prototype.isMatrix4=!0;var tt=Ia,Li=new D,fn=new tt,Yf=new D(0,0,0),Zf=new D(1,1,1),Zn=new D,wr=new D,jt=new D,jc=new tt,Qc=new Nt,Ft=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],u=i[9],h=i[2],f=i[6],d=i[10];switch(t){case"XYZ":this._y=Math.asin(Je(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Je(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Je(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Je(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Je(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Je(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:Oe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return jc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(jc,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Qc.setFromEuler(this),this.setFromQuaternion(Qc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ft.DEFAULT_ORDER="XYZ";var $i=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Jf=0,eh=new D,Di=new Nt,Bn=new tt,Er=new D,ys=new D,$f=new D,Kf=new Nt,th=new D(1,0,0),nh=new D(0,1,0),ih=new D(0,0,1),sh={type:"added"},jf={type:"removed"},Ni={type:"childadded",child:null},$o={type:"childremoved",child:null},Vt=class s extends An{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Jf++}),this.uuid=ls(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new D,t=new Ft,n=new Nt,i=new D(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new tt},normalMatrix:{value:new ke}}),this.matrix=new tt,this.matrixWorld=new tt,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new $i,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Di.setFromAxisAngle(e,t),this.quaternion.multiply(Di),this}rotateOnWorldAxis(e,t){return Di.setFromAxisAngle(e,t),this.quaternion.premultiply(Di),this}rotateX(e){return this.rotateOnAxis(th,e)}rotateY(e){return this.rotateOnAxis(nh,e)}rotateZ(e){return this.rotateOnAxis(ih,e)}translateOnAxis(e,t){return eh.copy(e).applyQuaternion(this.quaternion),this.position.add(eh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(th,e)}translateY(e){return this.translateOnAxis(nh,e)}translateZ(e){return this.translateOnAxis(ih,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Bn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Er.copy(e):Er.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),ys.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Bn.lookAt(ys,Er,this.up):Bn.lookAt(Er,ys,this.up),this.quaternion.setFromRotationMatrix(Bn),i&&(Bn.extractRotation(i.matrixWorld),Di.setFromRotationMatrix(Bn),this.quaternion.premultiply(Di.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Fe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(sh),Ni.child=e,this.dispatchEvent(Ni),Ni.child=null):Fe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(jf),$o.child=e,this.dispatchEvent($o),$o.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Bn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Bn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Bn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(sh),Ni.child=e,this.dispatchEvent(Ni),Ni.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ys,e,$f),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ys,Kf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,i=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*i,r[13]+=n-r[1]*t-r[5]*n-r[9]*i,r[14]+=i-r[2]*t-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let h=l[c];r(e.shapes,h)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];i.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),u=a(e.images),h=a(e.shapes),f=a(e.skeletons),d=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=i,n;function a(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Vt.DEFAULT_UP=new D(0,1,0);Vt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Vt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Mt=class extends Vt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Qf={type:"move"},Ki=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Mt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Mt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Mt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let x of e.hand.values()){let p=t.getJointPose(x,n),m=this._getHandJoint(c,x);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],f=u.position.distanceTo(h.position),d=.02,g=.005;c.inputState.pinching&&f>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Qf)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Mt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},cu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Jn={h:0,s:0,l:0},Tr={h:0,s:0,l:0};function Ko(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}var Be=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ct){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,et.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=et.workingColorSpace){return this.r=e,this.g=t,this.b=n,et.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=et.workingColorSpace){if(e=Hf(e,1),t=Je(t,0,1),n=Je(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Ko(a,r,e+1/3),this.g=Ko(a,r,e),this.b=Ko(a,r,e-1/3)}return et.colorSpaceToWorking(this,i),this}setStyle(e,t=Ct){function n(r){r!==void 0&&parseFloat(r)<1&&Oe("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Oe("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Oe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ct){let n=cu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Oe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Hn(e.r),this.g=Hn(e.g),this.b=Hn(e.b),this}copyLinearToSRGB(e){return this.r=Xi(e.r),this.g=Xi(e.g),this.b=Xi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ct){return et.workingToColorSpace(zt.copy(this),e),Math.round(Je(zt.r*255,0,255))*65536+Math.round(Je(zt.g*255,0,255))*256+Math.round(Je(zt.b*255,0,255))}getHexString(e=Ct){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=et.workingColorSpace){et.workingToColorSpace(zt.copy(this),t);let n=zt.r,i=zt.g,r=zt.b,a=Math.max(n,i,r),o=Math.min(n,i,r),l,c,u=(o+a)/2;if(o===a)l=0,c=0;else{let h=a-o;switch(c=u<=.5?h/(a+o):h/(2-a-o),a){case n:l=(i-r)/h+(i<r?6:0);break;case i:l=(r-n)/h+2;break;case r:l=(n-i)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=et.workingColorSpace){return et.workingToColorSpace(zt.copy(this),t),e.r=zt.r,e.g=zt.g,e.b=zt.b,e}getStyle(e=Ct){et.workingToColorSpace(zt.copy(this),e);let t=zt.r,n=zt.g,i=zt.b;return e!==Ct?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Jn),this.setHSL(Jn.h+e,Jn.s+t,Jn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Jn),e.getHSL(Tr);let n=Xo(Jn.h,Tr.h,t),i=Xo(Jn.s,Tr.s,t),r=Xo(Jn.l,Tr.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},zt=new Be;Be.NAMES=cu;var Ns=class extends Vt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ft,this.environmentIntensity=1,this.environmentRotation=new Ft,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},dn=new D,zn=new D,jo=new D,Vn=new D,Ui=new D,Fi=new D,rh=new D,Qo=new D,el=new D,tl=new D,nl=new vt,il=new vt,sl=new vt,Qn=class s{constructor(e=new D,t=new D,n=new D){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),dn.subVectors(e,t),i.cross(dn);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){dn.subVectors(i,t),zn.subVectors(n,t),jo.subVectors(e,t);let a=dn.dot(dn),o=dn.dot(zn),l=dn.dot(jo),c=zn.dot(zn),u=zn.dot(jo),h=a*c-o*o;if(h===0)return r.set(0,0,0),null;let f=1/h,d=(c*l-o*u)*f,g=(a*u-o*l)*f;return r.set(1-d-g,g,d)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Vn)===null?!1:Vn.x>=0&&Vn.y>=0&&Vn.x+Vn.y<=1}static getInterpolation(e,t,n,i,r,a,o,l){return this.getBarycoord(e,t,n,i,Vn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Vn.x),l.addScaledVector(a,Vn.y),l.addScaledVector(o,Vn.z),l)}static getInterpolatedAttribute(e,t,n,i,r,a){return nl.setScalar(0),il.setScalar(0),sl.setScalar(0),nl.fromBufferAttribute(e,t),il.fromBufferAttribute(e,n),sl.fromBufferAttribute(e,i),a.setScalar(0),a.addScaledVector(nl,r.x),a.addScaledVector(il,r.y),a.addScaledVector(sl,r.z),a}static isFrontFacing(e,t,n,i){return dn.subVectors(n,t),zn.subVectors(e,t),dn.cross(zn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return dn.subVectors(this.c,this.b),zn.subVectors(this.a,this.b),dn.cross(zn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,a,o;Ui.subVectors(i,n),Fi.subVectors(r,n),Qo.subVectors(e,n);let l=Ui.dot(Qo),c=Fi.dot(Qo);if(l<=0&&c<=0)return t.copy(n);el.subVectors(e,i);let u=Ui.dot(el),h=Fi.dot(el);if(u>=0&&h<=u)return t.copy(i);let f=l*h-u*c;if(f<=0&&l>=0&&u<=0)return a=l/(l-u),t.copy(n).addScaledVector(Ui,a);tl.subVectors(e,r);let d=Ui.dot(tl),g=Fi.dot(tl);if(g>=0&&d<=g)return t.copy(r);let x=d*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(Fi,o);let p=u*g-d*h;if(p<=0&&h-u>=0&&d-g>=0)return rh.subVectors(r,i),o=(h-u)/(h-u+(d-g)),t.copy(i).addScaledVector(rh,o);let m=1/(p+x+f);return a=x*m,o=f*m,t.copy(n).addScaledVector(Ui,a).addScaledVector(Fi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Cn=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(pn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(pn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=pn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,pn):pn.fromBufferAttribute(r,a),pn.applyMatrix4(e.matrixWorld),this.expandByPoint(pn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ar.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ar.copy(n.boundingBox)),Ar.applyMatrix4(e.matrixWorld),this.union(Ar)}let i=e.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,pn),pn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ms),Cr.subVectors(this.max,Ms),Oi.subVectors(e.a,Ms),Bi.subVectors(e.b,Ms),zi.subVectors(e.c,Ms),$n.subVectors(Bi,Oi),Kn.subVectors(zi,Bi),di.subVectors(Oi,zi);let t=[0,-$n.z,$n.y,0,-Kn.z,Kn.y,0,-di.z,di.y,$n.z,0,-$n.x,Kn.z,0,-Kn.x,di.z,0,-di.x,-$n.y,$n.x,0,-Kn.y,Kn.x,0,-di.y,di.x,0];return!rl(t,Oi,Bi,zi,Cr)||(t=[1,0,0,0,1,0,0,0,1],!rl(t,Oi,Bi,zi,Cr))?!1:(Rr.crossVectors($n,Kn),t=[Rr.x,Rr.y,Rr.z],rl(t,Oi,Bi,zi,Cr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,pn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(pn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Gn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Gn=[new D,new D,new D,new D,new D,new D,new D,new D],pn=new D,Ar=new Cn,Oi=new D,Bi=new D,zi=new D,$n=new D,Kn=new D,di=new D,Ms=new D,Cr=new D,Rr=new D,pi=new D;function rl(s,e,t,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){pi.fromArray(s,r);let o=i.x*Math.abs(pi.x)+i.y*Math.abs(pi.y)+i.z*Math.abs(pi.z),l=e.dot(pi),c=t.dot(pi),u=n.dot(pi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var wt=new D,Ir=new oe,ed=0,Ut=class extends An{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:ed++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=su,this.updateRanges=[],this.gpuType=cn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ir.fromBufferAttribute(this,t),Ir.applyMatrix3(e),this.setXY(t,Ir.x,Ir.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=vs(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Zt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=vs(t,this.array)),t}setX(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=vs(t,this.array)),t}setY(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=vs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=vs(t,this.array)),t}setW(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Zt(t,this.array),n=Zt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=Zt(t,this.array),n=Zt(n,this.array),i=Zt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=Zt(t,this.array),n=Zt(n,this.array),i=Zt(i,this.array),r=Zt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Us=class extends Ut{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Fs=class extends Ut{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var it=class extends Ut{constructor(e,t,n){super(new Float32Array(e),t,n)}},td=new Cn,bs=new D,al=new D,ei=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):td.setFromPoints(e).getCenter(n);let i=0;for(let r=0,a=e.length;r<a;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;bs.subVectors(e,this.center);let t=bs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(bs,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(al.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(bs.copy(e.center).add(al)),this.expandByPoint(bs.copy(e.center).sub(al))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},nd=0,on=new tt,ol=new Vt,Vi=new D,Qt=new Cn,Ss=new Cn,Lt=new D,Et=class s extends An{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:nd++}),this.uuid=ls(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Gf(e)?Fs:Us)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ke().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return on.makeRotationFromQuaternion(e),this.applyMatrix4(on),this}rotateX(e){return on.makeRotationX(e),this.applyMatrix4(on),this}rotateY(e){return on.makeRotationY(e),this.applyMatrix4(on),this}rotateZ(e){return on.makeRotationZ(e),this.applyMatrix4(on),this}translate(e,t,n){return on.makeTranslation(e,t,n),this.applyMatrix4(on),this}scale(e,t,n){return on.makeScale(e,t,n),this.applyMatrix4(on),this}lookAt(e){return ol.lookAt(e),ol.updateMatrix(),this.applyMatrix4(ol.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Vi).negate(),this.translate(Vi.x,Vi.y,Vi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let a=e[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new it(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&Oe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Cn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];Qt.setFromBufferAttribute(r),this.morphTargetsRelative?(Lt.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(Lt),Lt.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(Lt)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Fe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ei);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let n=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Ss.setFromBufferAttribute(o),this.morphTargetsRelative?(Lt.addVectors(Qt.min,Ss.min),Qt.expandByPoint(Lt),Lt.addVectors(Qt.max,Ss.max),Qt.expandByPoint(Lt)):(Qt.expandByPoint(Ss.min),Qt.expandByPoint(Ss.max))}Qt.getCenter(n);let i=0;for(let r=0,a=e.count;r<a;r++)Lt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Lt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Lt.fromBufferAttribute(o,c),l&&(Vi.fromBufferAttribute(e,c),Lt.add(Vi)),i=Math.max(i,n.distanceToSquared(Lt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Fe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Fe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,i=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Ut(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let v=0;v<n.count;v++)o[v]=new D,l[v]=new D;let c=new D,u=new D,h=new D,f=new oe,d=new oe,g=new oe,x=new D,p=new D;function m(v,T,R){c.fromBufferAttribute(n,v),u.fromBufferAttribute(n,T),h.fromBufferAttribute(n,R),f.fromBufferAttribute(r,v),d.fromBufferAttribute(r,T),g.fromBufferAttribute(r,R),u.sub(c),h.sub(c),d.sub(f),g.sub(f);let I=1/(d.x*g.y-g.x*d.y);isFinite(I)&&(x.copy(u).multiplyScalar(g.y).addScaledVector(h,-d.y).multiplyScalar(I),p.copy(h).multiplyScalar(d.x).addScaledVector(u,-g.x).multiplyScalar(I),o[v].add(x),o[T].add(x),o[R].add(x),l[v].add(p),l[T].add(p),l[R].add(p))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let v=0,T=M.length;v<T;++v){let R=M[v],I=R.start,U=R.count;for(let L=I,P=I+U;L<P;L+=3)m(e.getX(L+0),e.getX(L+1),e.getX(L+2))}let E=new D,y=new D,b=new D,w=new D;function A(v){b.fromBufferAttribute(i,v),w.copy(b);let T=o[v];E.copy(T),E.sub(b.multiplyScalar(b.dot(T))).normalize(),y.crossVectors(w,T);let I=y.dot(l[v])<0?-1:1;a.setXYZW(v,E.x,E.y,E.z,I)}for(let v=0,T=M.length;v<T;++v){let R=M[v],I=R.start,U=R.count;for(let L=I,P=I+U;L<P;L+=3)A(e.getX(L+0)),A(e.getX(L+1)),A(e.getX(L+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Ut(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let i=new D,r=new D,a=new D,o=new D,l=new D,c=new D,u=new D,h=new D;if(e)for(let f=0,d=e.count;f<d;f+=3){let g=e.getX(f+0),x=e.getX(f+1),p=e.getX(f+2);i.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),a.fromBufferAttribute(t,p),u.subVectors(a,r),h.subVectors(i,r),u.cross(h),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,p),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let f=0,d=t.count;f<d;f+=3)i.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),a.fromBufferAttribute(t,f+2),u.subVectors(a,r),h.subVectors(i,r),u.cross(h),n.setXYZ(f+0,u.x,u.y,u.z),n.setXYZ(f+1,u.x,u.y,u.z),n.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Lt.fromBufferAttribute(e,t),Lt.normalize(),e.setXYZ(t,Lt.x,Lt.y,Lt.z)}toNonIndexed(){function e(o,l){let c=o.array,u=o.itemSize,h=o.normalized,f=new c.constructor(l.length*u),d=0,g=0;for(let x=0,p=l.length;x<p;x++){o.isInterleavedBufferAttribute?d=l[x]*o.data.stride+o.offset:d=l[x]*u;for(let m=0;m<u;m++)f[g++]=c[d++]}return new Ut(f,u,h)}if(this.index===null)return Oe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let o in i){let l=i[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let u=0,h=c.length;u<h;u++){let f=c[u],d=e(f,n);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let i={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let h=0,f=c.length;h<f;h++){let d=c[h];u.push(d.toJSON(e.data))}u.length>0&&(i[l]=u,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let i=e.attributes;for(let c in i){let u=i[c];this.setAttribute(c,u.clone(t))}let r=e.morphAttributes;for(let c in r){let u=[],h=r[c];for(let f=0,d=h.length;f<d;f++)u.push(h[f].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,u=a.length;c<u;c++){let h=a[c];this.addGroup(h.start,h.count,h.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var ll=new D,id=new D,sd=new ke,en=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=ll.subVectors(n,t).cross(id.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let i=e.delta(ll),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(i,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||sd.getNormalMatrix(e),i=this.coplanarPoint(ll).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},rd=0,ti=class extends An{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:rd++}),this.uuid=ls(),this.name="",this.type="Material",this.blending=rs,this.side=oi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ll,this.blendDst=Dl,this.blendEquation=Si,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Be(0,0,0),this.blendAlpha=0,this.depthFunc=qi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Kh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Yr,this.stencilZFail=Yr,this.stencilZPass=Yr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Oe(`Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){Oe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=i(e.textures),a=i(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Be().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new en().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new oe().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new oe().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var kn=new D,cl=new D,Pr=new D,Lr=new D,Os=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,kn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=kn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(kn.copy(this.origin).addScaledVector(this.direction,t),kn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){cl.copy(e).add(t).multiplyScalar(.5),Pr.copy(t).sub(e).normalize(),Lr.copy(this.origin).sub(cl);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Pr),o=Lr.dot(this.direction),l=-Lr.dot(Pr),c=Lr.lengthSq(),u=Math.abs(1-a*a),h,f,d,g;if(u>0)if(h=a*l-o,f=a*o-l,g=r*u,h>=0)if(f>=-g)if(f<=g){let x=1/u;h*=x,f*=x,d=h*(h+a*f+2*o)+f*(a*h+f+2*l)+c}else f=r,h=Math.max(0,-(a*f+o)),d=-h*h+f*(f+2*l)+c;else f=-r,h=Math.max(0,-(a*f+o)),d=-h*h+f*(f+2*l)+c;else f<=-g?(h=Math.max(0,-(-a*r+o)),f=h>0?-r:Math.min(Math.max(-r,-l),r),d=-h*h+f*(f+2*l)+c):f<=g?(h=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(h=Math.max(0,-(a*r+o)),f=h>0?r:Math.min(Math.max(-r,-l),r),d=-h*h+f*(f+2*l)+c);else f=a>0?-r:r,h=Math.max(0,-(a*f+o)),d=-h*h+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),i&&i.copy(cl).addScaledVector(Pr,f),d}intersectSphere(e,t){if(e.radius<0)return null;kn.subVectors(e.center,this.origin);let n=kn.dot(this.direction),i=kn.dot(kn)-n*n,r=e.radius*e.radius;if(i>r)return null;let a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,a,o,l,c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,f=this.origin;return c>=0?(n=(e.min.x-f.x)*c,i=(e.max.x-f.x)*c):(n=(e.max.x-f.x)*c,i=(e.min.x-f.x)*c),u>=0?(r=(e.min.y-f.y)*u,a=(e.max.y-f.y)*u):(r=(e.max.y-f.y)*u,a=(e.min.y-f.y)*u),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),h>=0?(o=(e.min.z-f.z)*h,l=(e.max.z-f.z)*h):(o=(e.max.z-f.z)*h,l=(e.min.z-f.z)*h),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,kn)!==null}intersectTriangle(e,t,n,i,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,u=o.z,h=e.x-a.x,f=e.y-a.y,d=e.z-a.z,g=t.x-a.x,x=t.y-a.y,p=t.z-a.z,m=n.x-a.x,M=n.y-a.y,E=n.z-a.z,y=Math.abs(l),b=Math.abs(c),w=Math.abs(u),A,v,T,R,I,U,L,P,F,O,G,Q;if(y>=b&&y>=w?(T=l,U=h,F=g,Q=m,l>=0?(A=c,v=u,R=f,I=d,L=x,P=p,O=M,G=E):(A=u,v=c,R=d,I=f,L=p,P=x,O=E,G=M)):b>=w?(T=c,U=f,F=x,Q=M,c>=0?(A=u,v=l,R=d,I=h,L=p,P=g,O=E,G=m):(A=l,v=u,R=h,I=d,L=g,P=p,O=m,G=E)):(T=u,U=d,F=p,Q=E,u>=0?(A=l,v=c,R=h,I=f,L=g,P=x,O=m,G=M):(A=c,v=l,R=f,I=h,L=x,P=g,O=M,G=m)),T===0)return null;let k=A/T,Z=v/T,j=1/T,Ee=R-k*U,ye=I-Z*U,je=L-k*F,qe=P-Z*F,Qe=O-k*Q,Y=G-Z*Q,te=Qe*qe-Y*je,xe=Ee*Y-ye*Qe,ze=je*ye-qe*Ee;if(i){if(te<0||xe<0||ze<0)return null}else if((te<0||xe<0||ze<0)&&(te>0||xe>0||ze>0))return null;let be=te+xe+ze;if(be===0)return null;let Ve=j*(te*U+xe*F+ze*Q);return(be>0?Ve<0:Ve>0)?null:this.at(Ve/be,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Tt=class extends ti{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Be(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ft,this.combine=Pa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ah=new tt,mi=new Os,Dr=new ei,oh=new D,Nr=new D,Ur=new D,Fr=new D,hl=new D,Or=new D,lh=new D,Br=new D,We=class extends Vt{constructor(e=new Et,t=new Tt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let o=this.morphTargetInfluences;if(r&&o){Or.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=o[l],h=r[l];u!==0&&(hl.fromBufferAttribute(h,e),a?Or.addScaledVector(hl,u):Or.addScaledVector(hl.sub(t),u))}t.add(Or)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Dr.copy(n.boundingSphere),Dr.applyMatrix4(r),mi.copy(e.ray).recast(e.near),!(Dr.containsPoint(mi.origin)===!1&&(mi.intersectSphere(Dr,oh)===null||mi.origin.distanceToSquared(oh)>(e.far-e.near)**2))&&(ah.copy(r).invert(),mi.copy(e.ray).applyMatrix4(ah),!(n.boundingBox!==null&&mi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,mi)))}_computeIntersections(e,t,n){let i,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,f=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=f.length;g<x;g++){let p=f[g],m=a[p.materialIndex],M=Math.max(p.start,d.start),E=Math.min(o.count,Math.min(p.start+p.count,d.start+d.count));for(let y=M,b=E;y<b;y+=3){let w=o.getX(y),A=o.getX(y+1),v=o.getX(y+2);i=zr(this,m,e,n,c,u,h,w,A,v),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let g=Math.max(0,d.start),x=Math.min(o.count,d.start+d.count);for(let p=g,m=x;p<m;p+=3){let M=o.getX(p),E=o.getX(p+1),y=o.getX(p+2);i=zr(this,a,e,n,c,u,h,M,E,y),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=f.length;g<x;g++){let p=f[g],m=a[p.materialIndex],M=Math.max(p.start,d.start),E=Math.min(l.count,Math.min(p.start+p.count,d.start+d.count));for(let y=M,b=E;y<b;y+=3){let w=y,A=y+1,v=y+2;i=zr(this,m,e,n,c,u,h,w,A,v),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let g=Math.max(0,d.start),x=Math.min(l.count,d.start+d.count);for(let p=g,m=x;p<m;p+=3){let M=p,E=p+1,y=p+2;i=zr(this,a,e,n,c,u,h,M,E,y),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}}};function ad(s,e,t,n,i,r,a,o){let l;if(e.side===Xt?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,e.side===oi,o),l===null)return null;Br.copy(o),Br.applyMatrix4(s.matrixWorld);let c=t.ray.origin.distanceTo(Br);return c<t.near||c>t.far?null:{distance:c,point:Br.clone(),object:s}}function zr(s,e,t,n,i,r,a,o,l,c){s.getVertexPosition(o,Nr),s.getVertexPosition(l,Ur),s.getVertexPosition(c,Fr);let u=ad(s,e,t,n,Nr,Ur,Fr,lh);if(u){let h=new D;Qn.getBarycoord(lh,Nr,Ur,Fr,h),i&&(u.uv=Qn.getInterpolatedAttribute(i,o,l,c,h,new oe)),r&&(u.uv1=Qn.getInterpolatedAttribute(r,o,l,c,h,new oe)),a&&(u.normal=Qn.getInterpolatedAttribute(a,o,l,c,h,new D),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let f={a:o,b:l,c,normal:new D,materialIndex:0};Qn.getNormal(Nr,Ur,Fr,f.normal),u.face=f,u.barycoord=h}return u}var Bs=class extends Wt{constructor(e=null,t=1,n=1,i,r,a,o,l,c=Dt,u=Dt,h,f){super(null,a,o,l,c,u,i,r,h,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ji=class extends Ut{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Gi=new tt,ch=new tt,Vr=[],hh=new Cn,od=new tt,ws=new We,Es=new ei,gn=class extends We{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ji(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,od)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Cn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Gi),hh.copy(e.boundingBox).applyMatrix4(Gi),this.boundingBox.union(hh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ei),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Gi),Es.copy(e.boundingSphere).applyMatrix4(Gi),this.boundingSphere.union(Es)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(ws.geometry=this.geometry,ws.material=this.material,ws.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Es.copy(this.boundingSphere),Es.applyMatrix4(n),e.ray.intersectsSphere(Es)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Gi),ch.multiplyMatrices(n,Gi),ws.matrixWorld=ch,ws.raycast(e,Vr);for(let a=0,o=Vr.length;a<o;a++){let l=Vr[a];l.instanceId=r,l.object=this,t.push(l)}Vr.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new ji(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Bs(new Float32Array(i*this.count),i,this.count,Ba,cn));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=i*e;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},gi=new ei,ld=new oe(.5,.5),Gr=new D,Qi=class{constructor(e=new en,t=new en,n=new en,i=new en,r=new en,a=new en){this.planes=[e,t,n,i,r,a]}set(e,t,n,i,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=mn,n=!1){let i=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],u=r[4],h=r[5],f=r[6],d=r[7],g=r[8],x=r[9],p=r[10],m=r[11],M=r[12],E=r[13],y=r[14],b=r[15];if(i[0].setComponents(c-a,d-u,m-g,b-M).normalize(),i[1].setComponents(c+a,d+u,m+g,b+M).normalize(),i[2].setComponents(c+o,d+h,m+x,b+E).normalize(),i[3].setComponents(c-o,d-h,m-x,b-E).normalize(),n)i[4].setComponents(l,f,p,y).normalize(),i[5].setComponents(c-l,d-f,m-p,b-y).normalize();else if(i[4].setComponents(c-l,d-f,m-p,b-y).normalize(),t===mn)i[5].setComponents(c+l,d+f,m+p,b+y).normalize();else if(t===Yi)i[5].setComponents(l,f,p,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),gi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),gi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(gi)}intersectsSprite(e){gi.center.set(0,0,0);let t=ld.distanceTo(e.center);return gi.radius=.7071067811865476+t,gi.applyMatrix4(e.matrixWorld),this.intersectsSphere(gi)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(Gr.x=i.normal.x>0?e.max.x:e.min.x,Gr.y=i.normal.y>0?e.max.y:e.min.y,Gr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Gr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var zs=class extends Wt{constructor(e=[],t=li,n,i,r,a,o,l,c,u){super(e,t,n,i,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},vi=class extends Wt{constructor(e,t,n,i,r,a,o,l,c){super(e,t,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var ni=class extends Wt{constructor(e,t,n=vn,i,r,a,o=Dt,l=Dt,c,u=Tn,h=1){if(u!==Tn&&u!==ci)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:h};super(f,i,r,a,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ji(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},oa=class extends ni{constructor(e,t=vn,n=li,i,r,a=Dt,o=Dt,l,c=Tn){let u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,n,i,r,a,o,l,c),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Vs=class extends Wt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},dt=class s extends Et{constructor(e=1,t=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};let o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],u=[],h=[],f=0,d=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,i,a,2),g("x","z","y",1,-1,e,n,-t,i,a,3),g("x","y","z",1,-1,e,t,n,i,r,4),g("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new it(c,3)),this.setAttribute("normal",new it(u,3)),this.setAttribute("uv",new it(h,2));function g(x,p,m,M,E,y,b,w,A,v,T){let R=y/A,I=b/v,U=y/2,L=b/2,P=w/2,F=A+1,O=v+1,G=0,Q=0,k=new D;for(let Z=0;Z<O;Z++){let j=Z*I-L;for(let Ee=0;Ee<F;Ee++){let ye=Ee*R-U;k[x]=ye*M,k[p]=j*E,k[m]=P,c.push(k.x,k.y,k.z),k[x]=0,k[p]=0,k[m]=w>0?1:-1,u.push(k.x,k.y,k.z),h.push(Ee/A),h.push(1-Z/v),G+=1}}for(let Z=0;Z<v;Z++)for(let j=0;j<A;j++){let Ee=f+j+F*Z,ye=f+j+F*(Z+1),je=f+(j+1)+F*(Z+1),qe=f+(j+1)+F*Z;l.push(Ee,ye,qe),l.push(ye,je,qe),Q+=6}o.addGroup(d,Q,T),d+=Q,f+=G}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Gs=class s extends Et{constructor(e=1,t=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new D,u=new oe;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let h=0,f=3;h<=t;h++,f+=3){let d=n+h/t*i;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(a[f]/e+1)/2,u.y=(a[f+1]/e+1)/2,l.push(u.x,u.y)}for(let h=1;h<=t;h++)r.push(h,h+1,0);this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("normal",new it(o,3)),this.setAttribute("uv",new it(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.segments,e.thetaStart,e.thetaLength)}},es=class s extends Et{constructor(e=1,t=1,n=1,i=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;i=Math.floor(i),r=Math.floor(r);let u=[],h=[],f=[],d=[],g=0,x=[],p=n/2,m=0;M(),a===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(u),this.setAttribute("position",new it(h,3)),this.setAttribute("normal",new it(f,3)),this.setAttribute("uv",new it(d,2));function M(){let y=new D,b=new D,w=0,A=(t-e)/n;for(let v=0;v<=r;v++){let T=[],R=v/r,I=R*(t-e)+e;for(let U=0;U<=i;U++){let L=U/i,P=L*l+o,F=Math.sin(P),O=Math.cos(P);b.x=I*F,b.y=-R*n+p,b.z=I*O,h.push(b.x,b.y,b.z),y.set(F,A,O).normalize(),f.push(y.x,y.y,y.z),d.push(L,1-R),T.push(g++)}x.push(T)}for(let v=0;v<i;v++)for(let T=0;T<r;T++){let R=x[T][v],I=x[T+1][v],U=x[T+1][v+1],L=x[T][v+1];(e>0||T!==0)&&(u.push(R,I,L),w+=3),(t>0||T!==r-1)&&(u.push(I,U,L),w+=3)}c.addGroup(m,w,0),m+=w}function E(y){let b=g,w=new oe,A=new D,v=0,T=y===!0?e:t,R=y===!0?1:-1;for(let U=1;U<=i;U++)h.push(0,p*R,0),f.push(0,R,0),d.push(.5,.5),g++;let I=g;for(let U=0;U<=i;U++){let P=U/i*l+o,F=Math.cos(P),O=Math.sin(P);A.x=T*O,A.y=p*R,A.z=T*F,h.push(A.x,A.y,A.z),f.push(0,R,0),w.x=F*.5+.5,w.y=O*.5*R+.5,d.push(w.x,w.y),g++}for(let U=0;U<i;U++){let L=b+U,P=I+U;y===!0?u.push(P,P+1,L):u.push(P+1,P,L),v+=3}c.addGroup(m,v,y===!0?1:2),m+=v}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},yi=class s extends es{constructor(e=1,t=1,n=32,i=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new s(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var nn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Oe("Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),i=0,r=n.length,a;t?a=t:a=e*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(r-1);let u=n[i],f=n[i+1]-u,d=(a-u)/f;return(i+d)/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);let a=this.getPoint(i),o=this.getPoint(r),l=t||(a.isVector2?new oe:new D);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new D,i=[],r=[],a=[],o=new D,l=new tt;for(let d=0;d<=e;d++){let g=d/e;i[d]=this.getTangentAt(g,new D)}r[0]=new D,a[0]=new D;let c=Number.MAX_VALUE,u=Math.abs(i[0].x),h=Math.abs(i[0].y),f=Math.abs(i[0].z);u<=c&&(c=u,n.set(1,0,0)),h<=c&&(c=h,n.set(0,1,0)),f<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let d=1;d<=e;d++){if(r[d]=r[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(i[d-1],i[d]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(Je(i[d-1].dot(i[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(i[d],r[d])}if(t===!0){let d=Math.acos(Je(r[0].dot(r[e]),-1,1));d/=e,i[0].dot(o.crossVectors(r[0],r[e]))>0&&(d=-d);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(i[g],d*g)),a[g].crossVectors(i[g],r[g])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ts=class extends nn{constructor(e=0,t=0,n=1,i=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new oe){let n=t,i=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(a?r=0:r=i),this.aClockwise===!0&&!a&&(r===i?r=-i:r=r-i);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*u-d*h+this.aX,c=f*h+d*u+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},la=class extends ts{constructor(e,t,n,i,r,a){super(e,t,n,n,i,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function $l(){let s=0,e=0,t=0,n=0;function i(r,a,o,l){s=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){i(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,u,h){let f=(a-r)/c-(o-r)/(c+u)+(o-a)/u,d=(o-a)/u-(l-a)/(u+h)+(l-o)/h;f*=u,d*=u,i(a,o,f,d)},calc:function(r){let a=r*r,o=a*r;return s+e*r+t*a+n*o}}}var uh=new D,fh=new D,ul=new $l,fl=new $l,dl=new $l,ca=class extends nn{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new D){let n=t,i=this.points,r=i.length,a=(r-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,u;this.closed||o>0?c=i[(o-1)%r]:(fh.subVectors(i[0],i[1]).add(i[0]),c=fh);let h=i[o%r],f=i[(o+1)%r];if(this.closed||o+2<r?u=i[(o+2)%r]:(uh.subVectors(i[r-1],i[r-2]).add(i[r-1]),u=uh),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(h),d),x=Math.pow(h.distanceToSquared(f),d),p=Math.pow(f.distanceToSquared(u),d);x<1e-4&&(x=1),g<1e-4&&(g=x),p<1e-4&&(p=x),ul.initNonuniformCatmullRom(c.x,h.x,f.x,u.x,g,x,p),fl.initNonuniformCatmullRom(c.y,h.y,f.y,u.y,g,x,p),dl.initNonuniformCatmullRom(c.z,h.z,f.z,u.z,g,x,p)}else this.curveType==="catmullrom"&&(ul.initCatmullRom(c.x,h.x,f.x,u.x,this.tension),fl.initCatmullRom(c.y,h.y,f.y,u.y,this.tension),dl.initCatmullRom(c.z,h.z,f.z,u.z,this.tension));return n.set(ul.calc(l),fl.calc(l),dl.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new D().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function dh(s,e,t,n,i){let r=(n-e)*.5,a=(i-t)*.5,o=s*s,l=s*o;return(2*t-2*n+r+a)*l+(-3*t+3*n-2*r-a)*o+r*s+t}function cd(s,e){let t=1-s;return t*t*e}function hd(s,e){return 2*(1-s)*s*e}function ud(s,e){return s*s*e}function As(s,e,t,n){return cd(s,e)+hd(s,t)+ud(s,n)}function fd(s,e){let t=1-s;return t*t*t*e}function dd(s,e){let t=1-s;return 3*t*t*s*e}function pd(s,e){return 3*(1-s)*s*s*e}function md(s,e){return s*s*s*e}function Cs(s,e,t,n,i){return fd(s,e)+dd(s,t)+pd(s,n)+md(s,i)}var ks=class extends nn{constructor(e=new oe,t=new oe,n=new oe,i=new oe){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new oe){let n=t,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Cs(e,i.x,r.x,a.x,o.x),Cs(e,i.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ha=class extends nn{constructor(e=new D,t=new D,n=new D,i=new D){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new D){let n=t,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Cs(e,i.x,r.x,a.x,o.x),Cs(e,i.y,r.y,a.y,o.y),Cs(e,i.z,r.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Hs=class extends nn{constructor(e=new oe,t=new oe){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new oe){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new oe){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ua=class extends nn{constructor(e=new D,t=new D){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new D){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new D){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ws=class extends nn{constructor(e=new oe,t=new oe,n=new oe){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new oe){let n=t,i=this.v0,r=this.v1,a=this.v2;return n.set(As(e,i.x,r.x,a.x),As(e,i.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},fa=class extends nn{constructor(e=new D,t=new D,n=new D){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new D){let n=t,i=this.v0,r=this.v1,a=this.v2;return n.set(As(e,i.x,r.x,a.x),As(e,i.y,r.y,a.y),As(e,i.z,r.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Xs=class extends nn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new oe){let n=t,i=this.points,r=(i.length-1)*e,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],c=i[a],u=i[a>i.length-2?i.length-1:a+1],h=i[a>i.length-3?i.length-1:a+2];return n.set(dh(o,l.x,c.x,u.x,h.x),dh(o,l.y,c.y,u.y,h.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new oe().fromArray(i))}return this}},yl=Object.freeze({__proto__:null,ArcCurve:la,CatmullRomCurve3:ca,CubicBezierCurve:ks,CubicBezierCurve3:ha,EllipseCurve:ts,LineCurve:Hs,LineCurve3:ua,QuadraticBezierCurve:Ws,QuadraticBezierCurve3:fa,SplineCurve:Xs}),da=class extends nn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new yl[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),i=this.getCurveLengths(),r=0;for(;r<i.length;){if(i[r]>=n){let a=i[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let i=0,r=this.curves;i<r.length;i++){let a=r[i],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let u=l[c];n&&n.equals(u)||(t.push(u),n=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(new yl[i.type]().fromJSON(i))}return this}},qs=class extends da{constructor(e){super(),this.type="Path",this.currentPoint=new oe,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new Hs(this.currentPoint.clone(),new oe(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){let r=new Ws(this.currentPoint.clone(),new oe(e,t),new oe(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,r,a){let o=new ks(this.currentPoint.clone(),new oe(e,t),new oe(n,i),new oe(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new Xs(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,i,r,a),this}absarc(e,t,n,i,r,a){return this.absellipse(e,t,n,n,i,r,a),this}ellipse(e,t,n,i,r,a,o,l){let c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+c,t+u,n,i,r,a,o,l),this}absellipse(e,t,n,i,r,a,o,l){let c=new ts(e,t,n,i,r,a,o,l);if(this.curves.length>0){let h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);let u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},xn=class extends qs{constructor(e){super(e),this.uuid=ls(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(new qs().fromJSON(i))}return this}};function gd(s,e,t=2){let n=e&&e.length,i=n?e[0]*t:s.length,r=hu(s,0,i,t,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c;if(n&&(r=Md(s,e,r,t)),s.length>80*t){o=s[0],l=s[1];let u=o,h=l;for(let f=t;f<i;f+=t){let d=s[f],g=s[f+1];d<o&&(o=d),g<l&&(l=g),d>u&&(u=d),g>h&&(h=g)}c=Math.max(u-o,h-l),c=c!==0?32767/c:0}return Ys(r,a,t,o,l,c,0),a}function hu(s,e,t,n,i){let r;if(i===Ld(s,e,t,n)>0)for(let a=e;a<t;a+=n)r=ph(a/n|0,s[a],s[a+1],r);else for(let a=t-n;a>=e;a-=n)r=ph(a/n|0,s[a],s[a+1],r);return r&&ns(r,r.next)&&(Js(r),r=r.next),r}function Mi(s,e){if(!s)return s;e||(e=s);let t=s,n;do if(n=!1,!t.steiner&&(ns(t,t.next)||yt(t.prev,t,t.next)===0)){if(Js(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function Ys(s,e,t,n,i,r,a){if(!s)return;!a&&r&&Td(s,n,i,r);let o=s;for(;s.prev!==s.next;){let l=s.prev,c=s.next;if(r?_d(s,n,i,r):xd(s)){e.push(l.i,s.i,c.i),Js(s),s=c.next,o=c.next;continue}if(s=c,s===o){a?a===1?(s=vd(Mi(s),e),Ys(s,e,t,n,i,r,2)):a===2&&yd(s,e,t,n,i,r):Ys(Mi(s),e,t,n,i,r,1);break}}}function xd(s){let e=s.prev,t=s,n=s.next;if(yt(e,t,n)>=0)return!1;let i=e.x,r=t.x,a=n.x,o=e.y,l=t.y,c=n.y,u=Math.min(i,r,a),h=Math.min(o,l,c),f=Math.max(i,r,a),d=Math.max(o,l,c),g=n.next;for(;g!==e;){if(g.x>=u&&g.x<=f&&g.y>=h&&g.y<=d&&Ts(i,o,r,l,a,c,g.x,g.y)&&yt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function _d(s,e,t,n){let i=s.prev,r=s,a=s.next;if(yt(i,r,a)>=0)return!1;let o=i.x,l=r.x,c=a.x,u=i.y,h=r.y,f=a.y,d=Math.min(o,l,c),g=Math.min(u,h,f),x=Math.max(o,l,c),p=Math.max(u,h,f),m=Ml(d,g,e,t,n),M=Ml(x,p,e,t,n),E=s.prevZ,y=s.nextZ;for(;E&&E.z>=m&&y&&y.z<=M;){if(E.x>=d&&E.x<=x&&E.y>=g&&E.y<=p&&E!==i&&E!==a&&Ts(o,u,l,h,c,f,E.x,E.y)&&yt(E.prev,E,E.next)>=0||(E=E.prevZ,y.x>=d&&y.x<=x&&y.y>=g&&y.y<=p&&y!==i&&y!==a&&Ts(o,u,l,h,c,f,y.x,y.y)&&yt(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;E&&E.z>=m;){if(E.x>=d&&E.x<=x&&E.y>=g&&E.y<=p&&E!==i&&E!==a&&Ts(o,u,l,h,c,f,E.x,E.y)&&yt(E.prev,E,E.next)>=0)return!1;E=E.prevZ}for(;y&&y.z<=M;){if(y.x>=d&&y.x<=x&&y.y>=g&&y.y<=p&&y!==i&&y!==a&&Ts(o,u,l,h,c,f,y.x,y.y)&&yt(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function vd(s,e){let t=s;do{let n=t.prev,i=t.next.next;!ns(n,i)&&fu(n,t,t.next,i)&&Zs(n,i)&&Zs(i,n)&&(e.push(n.i,t.i,i.i),Js(t),Js(t.next),t=s=i),t=t.next}while(t!==s);return Mi(t)}function yd(s,e,t,n,i,r){let a=s;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Rd(a,o)){let l=du(a,o);a=Mi(a,a.next),l=Mi(l,l.next),Ys(a,e,t,n,i,r,0),Ys(l,e,t,n,i,r,0);return}o=o.next}a=a.next}while(a!==s)}function Md(s,e,t,n){let i=[];for(let r=0,a=e.length;r<a;r++){let o=e[r]*n,l=r<a-1?e[r+1]*n:s.length,c=hu(s,o,l,n,!1);c===c.next&&(c.steiner=!0),i.push(Cd(c))}i.sort(bd);for(let r=0;r<i.length;r++)t=Sd(i[r],t);return t}function bd(s,e){let t=s.x-e.x;if(t===0&&(t=s.y-e.y,t===0)){let n=(s.next.y-s.y)/(s.next.x-s.x),i=(e.next.y-e.y)/(e.next.x-e.x);t=n-i}return t}function Sd(s,e){let t=wd(s,e);if(!t)return e;let n=du(t,s);return Mi(n,n.next),Mi(t,t.next)}function wd(s,e){let t=e,n=s.x,i=s.y,r=-1/0,a;if(ns(s,t))return t;do{if(ns(s,t.next))return t.next;if(i<=t.y&&i>=t.next.y&&t.next.y!==t.y){let h=t.x+(i-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(h<=n&&h>r&&(r=h,a=t.x<t.next.x?t:t.next,h===n))return a}t=t.next}while(t!==e);if(!a)return null;let o=a,l=a.x,c=a.y,u=1/0;t=a;do{if(n>=t.x&&t.x>=l&&n!==t.x&&uu(i<c?n:r,i,l,c,i<c?r:n,i,t.x,t.y)){let h=Math.abs(i-t.y)/(n-t.x);Zs(t,s)&&(h<u||h===u&&(t.x>a.x||t.x===a.x&&Ed(a,t)))&&(a=t,u=h)}t=t.next}while(t!==o);return a}function Ed(s,e){return yt(s.prev,s,e.prev)<0&&yt(e.next,s,s.next)<0}function Td(s,e,t,n){let i=s;do i.z===0&&(i.z=Ml(i.x,i.y,e,t,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,Ad(i)}function Ad(s){let e,t=1;do{let n=s,i;s=null;let r=null;for(e=0;n;){e++;let a=n,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(i=n,n=n.nextZ,o--):(i=a,a=a.nextZ,l--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;n=a}r.nextZ=null,t*=2}while(e>1);return s}function Ml(s,e,t,n,i){return s=(s-t)*i|0,e=(e-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,s|e<<1}function Cd(s){let e=s,t=s;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==s);return t}function uu(s,e,t,n,i,r,a,o){return(i-a)*(e-o)>=(s-a)*(r-o)&&(s-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(i-a)*(n-o)}function Ts(s,e,t,n,i,r,a,o){return!(s===a&&e===o)&&uu(s,e,t,n,i,r,a,o)}function Rd(s,e){return s.next.i!==e.i&&s.prev.i!==e.i&&!Id(s,e)&&(Zs(s,e)&&Zs(e,s)&&Pd(s,e)&&(yt(s.prev,s,e.prev)||yt(s,e.prev,e))||ns(s,e)&&yt(s.prev,s,s.next)>0&&yt(e.prev,e,e.next)>0)}function yt(s,e,t){return(e.y-s.y)*(t.x-e.x)-(e.x-s.x)*(t.y-e.y)}function ns(s,e){return s.x===e.x&&s.y===e.y}function fu(s,e,t,n){let i=Hr(yt(s,e,t)),r=Hr(yt(s,e,n)),a=Hr(yt(t,n,s)),o=Hr(yt(t,n,e));return!!(i!==r&&a!==o||i===0&&kr(s,t,e)||r===0&&kr(s,n,e)||a===0&&kr(t,s,n)||o===0&&kr(t,e,n))}function kr(s,e,t){return e.x<=Math.max(s.x,t.x)&&e.x>=Math.min(s.x,t.x)&&e.y<=Math.max(s.y,t.y)&&e.y>=Math.min(s.y,t.y)}function Hr(s){return s>0?1:s<0?-1:0}function Id(s,e){let t=s;do{if(t.i!==s.i&&t.next.i!==s.i&&t.i!==e.i&&t.next.i!==e.i&&fu(t,t.next,s,e))return!0;t=t.next}while(t!==s);return!1}function Zs(s,e){return yt(s.prev,s,s.next)<0?yt(s,e,s.next)>=0&&yt(s,s.prev,e)>=0:yt(s,e,s.prev)<0||yt(s,s.next,e)<0}function Pd(s,e){let t=s,n=!1,i=(s.x+e.x)/2,r=(s.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&i<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==s);return n}function du(s,e){let t=bl(s.i,s.x,s.y),n=bl(e.i,e.x,e.y),i=s.next,r=e.prev;return s.next=e,e.prev=s,t.next=i,i.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function ph(s,e,t,n){let i=bl(s,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Js(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function bl(s,e,t){return{i:s,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Ld(s,e,t,n){let i=0;for(let r=e,a=t-n;r<t;r+=n)i+=(s[a]-s[r])*(s[r+1]+s[a+1]),a=r;return i}var Sl=class{static triangulate(e,t,n=2){return gd(e,t,n)}},En=class s{static area(e){let t=e.length,n=0;for(let i=t-1,r=0;r<t;i=r++)n+=e[i].x*e[r].y-e[r].x*e[i].y;return n*.5}static isClockWise(e){return s.area(e)<0}static triangulateShape(e,t){let n=[],i=[],r=[];mh(e),gh(n,e);let a=e.length;t.forEach(mh);for(let l=0;l<t.length;l++)i.push(a),a+=t[l].length,gh(n,t[l]);let o=Sl.triangulate(n,i);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function mh(s){let e=s.length;e>2&&s[e-1].equals(s[0])&&s.pop()}function gh(s,e){for(let t=0;t<e.length;t++)s.push(e[t].x),s.push(e[t].y)}var is=class s extends Et{constructor(e=new xn([new oe(.5,.5),new oe(-.5,.5),new oe(-.5,-.5),new oe(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,i=[],r=[];for(let o=0,l=e.length;o<l;o++){let c=e[o];a(c)}this.setAttribute("position",new it(i,3)),this.setAttribute("uv",new it(r,2)),this.computeVertexNormals();function a(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,u=t.steps!==void 0?t.steps:1,h=t.depth!==void 0?t.depth:1,f=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:d-.1,x=t.bevelOffset!==void 0?t.bevelOffset:0,p=t.bevelSegments!==void 0?t.bevelSegments:3,m=t.extrudePath,M=t.UVGenerator!==void 0?t.UVGenerator:Dd,E,y=!1,b,w,A,v;if(m){E=m.getSpacedPoints(u),y=!0,f=!1;let ne=m.isCatmullRomCurve3?m.closed:!1;b=m.computeFrenetFrames(u,ne),w=new D,A=new D,v=new D}f||(p=0,d=0,g=0,x=0);let T=o.extractPoints(c),R=T.shape,I=T.holes;if(!En.isClockWise(R)){R=R.reverse();for(let ne=0,se=I.length;ne<se;ne++){let re=I[ne];En.isClockWise(re)&&(I[ne]=re.reverse())}}function L(ne){let re=10000000000000001e-36,ae=ne[0];for(let he=1;he<=ne.length;he++){let Ne=he%ne.length,De=ne[Ne],Ge=De.x-ae.x,He=De.y-ae.y,N=Ge*Ge+He*He,st=Math.max(Math.abs(De.x),Math.abs(De.y),Math.abs(ae.x),Math.abs(ae.y)),$e=re*st*st;if(N<=$e){ne.splice(Ne,1),he--;continue}ae=De}}L(R),I.forEach(L);let P=I.length,F=R;for(let ne=0;ne<P;ne++){let se=I[ne];R=R.concat(se)}function O(ne,se,re){return se||Fe("ExtrudeGeometry: vec does not exist"),ne.clone().addScaledVector(se,re)}let G=R.length;function Q(ne,se,re){let ae,he,Ne,De=ne.x-se.x,Ge=ne.y-se.y,He=re.x-ne.x,N=re.y-ne.y,st=De*De+Ge*Ge,$e=De*N-Ge*He;if(Math.abs($e)>Number.EPSILON){let C=Math.sqrt(st),_=Math.sqrt(He*He+N*N),V=se.x-Ge/C,X=se.y+De/C,J=re.x-N/_,le=re.y+He/_,ce=((J-V)*N-(le-X)*He)/(De*N-Ge*He);ae=V+De*ce-ne.x,he=X+Ge*ce-ne.y;let $=ae*ae+he*he;if($<=2)return new oe(ae,he);Ne=Math.sqrt($/2)}else{let C=!1;De>Number.EPSILON?He>Number.EPSILON&&(C=!0):De<-Number.EPSILON?He<-Number.EPSILON&&(C=!0):Math.sign(Ge)===Math.sign(N)&&(C=!0),C?(ae=-Ge,he=De,Ne=Math.sqrt(st)):(ae=De,he=Ge,Ne=Math.sqrt(st/2))}return new oe(ae/Ne,he/Ne)}let k=[];for(let ne=0,se=F.length,re=se-1,ae=ne+1;ne<se;ne++,re++,ae++)re===se&&(re=0),ae===se&&(ae=0),k[ne]=Q(F[ne],F[re],F[ae]);let Z=[],j,Ee=k.concat();for(let ne=0,se=P;ne<se;ne++){let re=I[ne];j=[];for(let ae=0,he=re.length,Ne=he-1,De=ae+1;ae<he;ae++,Ne++,De++)Ne===he&&(Ne=0),De===he&&(De=0),j[ae]=Q(re[ae],re[Ne],re[De]);Z.push(j),Ee=Ee.concat(j)}let ye;if(p===0)ye=En.triangulateShape(F,I);else{let ne=[],se=[];for(let re=0;re<p;re++){let ae=re/p,he=d*Math.cos(ae*Math.PI/2),Ne=g*Math.sin(ae*Math.PI/2)+x;for(let De=0,Ge=F.length;De<Ge;De++){let He=O(F[De],k[De],Ne);xe(He.x,He.y,-he),ae===0&&ne.push(He)}for(let De=0,Ge=P;De<Ge;De++){let He=I[De];j=Z[De];let N=[];for(let st=0,$e=He.length;st<$e;st++){let C=O(He[st],j[st],Ne);xe(C.x,C.y,-he),ae===0&&N.push(C)}ae===0&&se.push(N)}}ye=En.triangulateShape(ne,se)}let je=ye.length,qe=g+x;for(let ne=0;ne<G;ne++){let se=f?O(R[ne],Ee[ne],qe):R[ne];y?(A.copy(b.normals[0]).multiplyScalar(se.x),w.copy(b.binormals[0]).multiplyScalar(se.y),v.copy(E[0]).add(A).add(w),xe(v.x,v.y,v.z)):xe(se.x,se.y,0)}for(let ne=1;ne<=u;ne++)for(let se=0;se<G;se++){let re=f?O(R[se],Ee[se],qe):R[se];y?(A.copy(b.normals[ne]).multiplyScalar(re.x),w.copy(b.binormals[ne]).multiplyScalar(re.y),v.copy(E[ne]).add(A).add(w),xe(v.x,v.y,v.z)):xe(re.x,re.y,h/u*ne)}for(let ne=p-1;ne>=0;ne--){let se=ne/p,re=d*Math.cos(se*Math.PI/2),ae=g*Math.sin(se*Math.PI/2)+x;for(let he=0,Ne=F.length;he<Ne;he++){let De=O(F[he],k[he],ae);xe(De.x,De.y,h+re)}for(let he=0,Ne=I.length;he<Ne;he++){let De=I[he];j=Z[he];for(let Ge=0,He=De.length;Ge<He;Ge++){let N=O(De[Ge],j[Ge],ae);y?xe(N.x,N.y+E[u-1].y,E[u-1].x+re):xe(N.x,N.y,h+re)}}}Qe(),Y();function Qe(){let ne=i.length/3;if(f){let se=0,re=G*se;for(let ae=0;ae<je;ae++){let he=ye[ae];ze(he[2]+re,he[1]+re,he[0]+re)}se=u+p*2,re=G*se;for(let ae=0;ae<je;ae++){let he=ye[ae];ze(he[0]+re,he[1]+re,he[2]+re)}}else{for(let se=0;se<je;se++){let re=ye[se];ze(re[2],re[1],re[0])}for(let se=0;se<je;se++){let re=ye[se];ze(re[0]+G*u,re[1]+G*u,re[2]+G*u)}}n.addGroup(ne,i.length/3-ne,0)}function Y(){let ne=i.length/3,se=0;te(F,se),se+=F.length;for(let re=0,ae=I.length;re<ae;re++){let he=I[re];te(he,se),se+=he.length}n.addGroup(ne,i.length/3-ne,1)}function te(ne,se){let re=ne.length;for(;--re>=0;){let ae=re,he=re-1;he<0&&(he=ne.length-1);for(let Ne=0,De=u+p*2;Ne<De;Ne++){let Ge=G*Ne,He=G*(Ne+1),N=se+ae+Ge,st=se+he+Ge,$e=se+he+He,C=se+ae+He;be(N,st,$e,C)}}}function xe(ne,se,re){l.push(ne),l.push(se),l.push(re)}function ze(ne,se,re){Ve(ne),Ve(se),Ve(re);let ae=i.length/3,he=M.generateTopUV(n,i,ae-3,ae-2,ae-1);lt(he[0]),lt(he[1]),lt(he[2])}function be(ne,se,re,ae){Ve(ne),Ve(se),Ve(ae),Ve(se),Ve(re),Ve(ae);let he=i.length/3,Ne=M.generateSideWallUV(n,i,he-6,he-3,he-2,he-1);lt(Ne[0]),lt(Ne[1]),lt(Ne[3]),lt(Ne[1]),lt(Ne[2]),lt(Ne[3])}function Ve(ne){i.push(l[ne*3+0]),i.push(l[ne*3+1]),i.push(l[ne*3+2])}function lt(ne){r.push(ne.x),r.push(ne.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Nd(t,n,e)}static fromJSON(e,t){let n=[];for(let r=0,a=e.shapes.length;r<a;r++){let o=t[e.shapes[r]];n.push(o)}let i=e.options.extrudePath;return i!==void 0&&(e.options.extrudePath=new yl[i.type]().fromJSON(i)),new s(n,e.options)}},Dd={generateTopUV:function(s,e,t,n,i){let r=e[t*3],a=e[t*3+1],o=e[n*3],l=e[n*3+1],c=e[i*3],u=e[i*3+1];return[new oe(r,a),new oe(o,l),new oe(c,u)]},generateSideWallUV:function(s,e,t,n,i,r){let a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[n*3],u=e[n*3+1],h=e[n*3+2],f=e[i*3],d=e[i*3+1],g=e[i*3+2],x=e[r*3],p=e[r*3+1],m=e[r*3+2];return Math.abs(o-u)<Math.abs(a-c)?[new oe(a,1-l),new oe(c,1-h),new oe(f,1-g),new oe(x,1-m)]:[new oe(o,1-l),new oe(u,1-h),new oe(d,1-g),new oe(p,1-m)]}};function Nd(s,e,t){if(t.shapes=[],Array.isArray(s))for(let n=0,i=s.length;n<i;n++){let r=s[n];t.shapes.push(r.uuid)}else t.shapes.push(s.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var $s=class s extends Et{constructor(e=[new oe(0,-.5),new oe(.5,0),new oe(0,.5)],t=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:i},t=Math.floor(t),i=Je(i,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],u=1/t,h=new D,f=new oe,d=new D,g=new D,x=new D,p=0,m=0;for(let M=0;M<=e.length-1;M++)switch(M){case 0:p=e[M+1].x-e[M].x,m=e[M+1].y-e[M].y,d.x=m*1,d.y=-p,d.z=m*0,x.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case e.length-1:l.push(x.x,x.y,x.z);break;default:p=e[M+1].x-e[M].x,m=e[M+1].y-e[M].y,d.x=m*1,d.y=-p,d.z=m*0,g.copy(d),d.x+=x.x,d.y+=x.y,d.z+=x.z,d.normalize(),l.push(d.x,d.y,d.z),x.copy(g)}for(let M=0;M<=t;M++){let E=n+M*u*i,y=Math.sin(E),b=Math.cos(E);for(let w=0;w<=e.length-1;w++){h.x=e[w].x*y,h.y=e[w].y,h.z=e[w].x*b,a.push(h.x,h.y,h.z),f.x=M/t,f.y=w/(e.length-1),o.push(f.x,f.y);let A=l[3*w+0]*y,v=l[3*w+1],T=l[3*w+0]*b;c.push(A,v,T)}}for(let M=0;M<t;M++)for(let E=0;E<e.length-1;E++){let y=E+M*e.length,b=y,w=y+e.length,A=y+e.length+1,v=y+1;r.push(b,w,v),r.push(A,v,w)}this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("uv",new it(o,2)),this.setAttribute("normal",new it(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.points,e.segments,e.phiStart,e.phiLength)}};var Rn=class s extends Et{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,u=l+1,h=e/o,f=t/l,d=[],g=[],x=[],p=[];for(let m=0;m<u;m++){let M=m*f-a;for(let E=0;E<c;E++){let y=E*h-r;g.push(y,-M,0),x.push(0,0,1),p.push(E/o),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let M=0;M<o;M++){let E=M+c*m,y=M+c*(m+1),b=M+1+c*(m+1),w=M+1+c*m;d.push(E,y,w),d.push(y,b,w)}this.setIndex(d),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}};var Ks=class s extends Et{constructor(e=new xn([new oe(0,.5),new oe(-.5,-.5),new oe(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],i=[],r=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let u=0;u<e.length;u++)c(e[u]),this.addGroup(o,l,u),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new it(i,3)),this.setAttribute("normal",new it(r,3)),this.setAttribute("uv",new it(a,2));function c(u){let h=i.length/3,f=u.extractPoints(t),d=f.shape,g=f.holes;En.isClockWise(d)===!1&&(d=d.reverse());for(let p=0,m=g.length;p<m;p++){let M=g[p];En.isClockWise(M)===!0&&(g[p]=M.reverse())}let x=En.triangulateShape(d,g);for(let p=0,m=g.length;p<m;p++){let M=g[p];d=d.concat(M)}for(let p=0,m=d.length;p<m;p++){let M=d[p];i.push(M.x,M.y,0),r.push(0,0,1),a.push(M.x,M.y)}for(let p=0,m=x.length;p<m;p++){let M=x[p],E=M[0]+h,y=M[1]+h,b=M[2]+h;n.push(E,y,b),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Ud(t,e)}static fromJSON(e,t){let n=[];for(let i=0,r=e.shapes.length;i<r;i++){let a=t[e.shapes[i]];n.push(a)}return new s(n,e.curveSegments)}};function Ud(s,e){if(e.shapes=[],Array.isArray(s))for(let t=0,n=s.length;t<n;t++){let i=s[t];e.shapes.push(i.uuid)}else e.shapes.push(s.uuid);return e}var js=class s extends Et{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,u=[],h=new D,f=new D,d=[],g=[],x=[],p=[];for(let m=0;m<=n;m++){let M=[],E=m/n,y=a+E*o,b=e*Math.cos(y),w=Math.sqrt(e*e-b*b),A=0;m===0&&a===0?A=.5/t:m===n&&l===Math.PI&&(A=-.5/t);for(let v=0;v<=t;v++){let T=v/t,R=i+T*r;h.x=-w*Math.cos(R),h.y=b,h.z=w*Math.sin(R),g.push(h.x,h.y,h.z),f.copy(h).normalize(),x.push(f.x,f.y,f.z),p.push(T+A,1-E),M.push(c++)}u.push(M)}for(let m=0;m<n;m++)for(let M=0;M<t;M++){let E=u[m][M+1],y=u[m][M],b=u[m+1][M],w=u[m+1][M+1];(m!==0||a>0)&&d.push(E,y,w),(m!==n-1||l<Math.PI)&&d.push(y,b,w)}this.setIndex(d),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};function Ei(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];if(xh(i))i.isRenderTargetTexture?(Oe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone();else if(Array.isArray(i))if(xh(i[0])){let r=[];for(let a=0,o=i.length;a<o;a++)r[a]=i[a].clone();e[t][n]=r}else e[t][n]=i.slice();else e[t][n]=i}}return e}function Gt(s){let e={};for(let t=0;t<s.length;t++){let n=Ei(s[t]);for(let i in n)e[i]=n[i]}return e}function xh(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function Fd(s){let e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Kl(s){let e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:et.workingColorSpace}var pu={clone:Ei,merge:Gt},Od=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Bd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,sn=class extends ti{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Od,this.fragmentShader=Bd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ei(e.uniforms),this.uniformsGroups=Fd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let a=this.uniforms[i].value;a&&a.isTexture?t.uniforms[i]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[i]={type:"m4",value:a.toArray()}:t.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let i=e.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=t[i.value]||null;break;case"c":this.uniforms[n].value=new Be().setHex(i.value);break;case"v2":this.uniforms[n].value=new oe().fromArray(i.value);break;case"v3":this.uniforms[n].value=new D().fromArray(i.value);break;case"v4":this.uniforms[n].value=new vt().fromArray(i.value);break;case"m3":this.uniforms[n].value=new ke().fromArray(i.value);break;case"m4":this.uniforms[n].value=new tt().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},pa=class extends sn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var At=class extends ti{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Be(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Be(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vo,this.normalScale=new oe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ft,this.combine=Pa,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},ma=class extends ti{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Jh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ga=class extends ti{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ki(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function pl(s){return s!==void 0&&s.inTangents!==void 0&&s.outTangents!==void 0}var ii=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let a=0;a!==i;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},xa=class extends ii{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:xl,endingEnd:xl}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,a=e+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case _l:r=e,o=2*t-n;break;case vl:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case _l:a=e,l=2*n-t;break;case vl:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}let c=(n-t)*.5,u=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this._offsetPrev,h=this._offsetNext,f=this._weightPrev,d=this._weightNext,g=(n-t)/(i-t),x=g*g,p=x*g,m=-f*p+2*f*x-f*g,M=(1+f)*p+(-1.5-2*f)*x+(-.5+f)*g+1,E=(-1-d)*p+(1.5+d)*x+.5*g,y=d*p-d*x;for(let b=0;b!==o;++b)r[b]=m*a[u+b]+M*a[c+b]+E*a[l+b]+y*a[h+b];return r}},_a=class extends ii{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=(n-t)/(i-t),h=1-u;for(let f=0;f!==o;++f)r[f]=a[c+f]*h+a[l+f]*u;return r}},va=class extends ii{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},ya=class extends ii{interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this.inTangents,h=this.outTangents;if(!u||!h){let g=(n-t)/(i-t),x=1-g;for(let p=0;p!==o;++p)r[p]=a[c+p]*x+a[l+p]*g;return r}let f=o*2,d=e-1;for(let g=0;g!==o;++g){let x=a[c+g],p=a[l+g],m=d*f+g*2,M=h[m],E=h[m+1],y=e*f+g*2,b=u[y],w=u[y+1],A=Vd(n,t,M,b,i);r[g]=mu(A,x,E,w,p)}return r}};function mu(s,e,t,n,i){let r=1-s;return r*r*r*e+3*r*r*s*t+3*r*s*s*n+s*s*s*i}function zd(s,e,t,n,i){let r=1-s;return 3*r*r*(t-e)+6*r*s*(n-t)+3*s*s*(i-n)}function Vd(s,e,t,n,i){let r=(s-e)/(i-e);for(let a=0;a<8;a++){let o=mu(r,e,t,n,i)-s;if(Math.abs(o)<1e-10)break;let l=zd(r,e,t,n,i);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var rn=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ki(t,this.TimeBufferType),this.values=ki(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ki(e.times,Array),values:ki(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i),pl(e.settings)&&(n.settings={inTangents:ki(e.settings.inTangents,Array),outTangents:ki(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new va(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new _a(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new xa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new ya(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Rs:t=this.InterpolantFactoryMethodDiscrete;break;case na:t=this.InterpolantFactoryMethodLinear;break;case qr:t=this.InterpolantFactoryMethodSmooth;break;case gl:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Oe("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Rs;case this.InterpolantFactoryMethodLinear:return na;case this.InterpolantFactoryMethodSmooth:return qr;case this.InterpolantFactoryMethodBezier:return gl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e;pl(this.settings)&&(_h(this.settings.inTangents,e),_h(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,i=n.length,r=0,a=i-1;for(;r!==i&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Fe("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(Fe("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Fe("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Fe("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(i!==void 0&&kf(i))for(let o=0,l=i.length;o!==l;++o){let c=i[o];if(isNaN(c)){Fe("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===qr,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],u=e[o+1];if(c!==u&&(o!==1||c!==e[0]))if(i)l=!0;else{let h=o*n,f=h-n,d=h+n;for(let g=0;g!==n;++g){let x=t[h+g];if(x!==t[f+g]||x!==t[d+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let h=o*n,f=a*n;for(let d=0;d!==n;++d)t[f+d]=t[h+d]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,pl(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function _h(s,e){for(let t=0,n=s.length;t!==n;t+=2)s[t]*=e}rn.prototype.ValueTypeName="";rn.prototype.TimeBufferType=Float32Array;rn.prototype.ValueBufferType=Float32Array;rn.prototype.DefaultInterpolation=na;var si=class extends rn{constructor(e,t,n){super(e,t,n)}};si.prototype.ValueTypeName="bool";si.prototype.ValueBufferType=Array;si.prototype.DefaultInterpolation=Rs;si.prototype.InterpolantFactoryMethodLinear=void 0;si.prototype.InterpolantFactoryMethodSmooth=void 0;var Ma=class extends rn{constructor(e,t,n,i){super(e,t,n,i)}};Ma.prototype.ValueTypeName="color";var ba=class extends rn{constructor(e,t,n,i){super(e,t,n,i)}};ba.prototype.ValueTypeName="number";var Sa=class extends ii{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t),c=e*o;for(let u=c+o;c!==u;c+=4)Nt.slerpFlat(r,0,a,c-o,a,c,l);return r}},Qs=class extends rn{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new Sa(this.times,this.values,this.getValueSize(),e)}};Qs.prototype.ValueTypeName="quaternion";Qs.prototype.InterpolantFactoryMethodSmooth=void 0;var ri=class extends rn{constructor(e,t,n){super(e,t,n)}};ri.prototype.ValueTypeName="string";ri.prototype.ValueBufferType=Array;ri.prototype.DefaultInterpolation=Rs;ri.prototype.InterpolantFactoryMethodLinear=void 0;ri.prototype.InterpolantFactoryMethodSmooth=void 0;var wa=class extends rn{constructor(e,t,n,i){super(e,t,n,i)}};wa.prototype.ValueTypeName="vector";var Ea=class{constructor(e,t,n){let i=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&i.onStart!==void 0&&i.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,i.onProgress!==void 0&&i.onProgress(u,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,h){return c.push(u,h),this},this.removeHandler=function(u){let h=c.indexOf(u);return h!==-1&&c.splice(h,2),this},this.getHandler=function(u){for(let h=0,f=c.length;h<f;h+=2){let d=c[h],g=c[h+1];if(d.global&&(d.lastIndex=0),d.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},gu=new Ea,Ta=class{constructor(e){this.manager=e!==void 0?e:gu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Ta.DEFAULT_MATERIAL_NAME="__DEFAULT";var er=class extends Vt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Be(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},tr=class extends er{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Vt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Be(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},ml=new tt,vh=new D,yh=new D,Aa=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new oe(512,512),this.mapType=Kt,this.map=null,this.mapPass=null,this.matrix=new tt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Qi,this._frameExtents=new oe(1,1),this._viewportCount=1,this._viewports=[new vt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;vh.setFromMatrixPosition(e.matrixWorld),t.position.copy(vh),yh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(yh),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,i){ml.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(ml,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,a=i?i.z/r.x:1,o=i?i.w/r.y:1,l=i?i.x/r.x:0,c=i?i.y/r.y:0;e.coordinateSystem===Yi||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(ml)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Wr=new D,Xr=new Nt,wn=new D,nr=class extends Vt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new tt,this.projectionMatrix=new tt,this.projectionMatrixInverse=new tt,this.coordinateSystem=mn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Wr,Xr,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Wr,Xr,wn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Wr,Xr,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Wr,Xr,wn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},jn=new D,Mh=new oe,bh=new oe,Jt=class extends nr{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ia*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Wo*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ia*2*Math.atan(Math.tan(Wo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){jn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(jn.x,jn.y).multiplyScalar(-e/jn.z),jn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(jn.x,jn.y).multiplyScalar(-e/jn.z)}getViewSize(e,t){return this.getViewBounds(e,Mh,bh),t.subVectors(bh,Mh)}setViewOffset(e,t,n,i,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Wo*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var ai=class extends nr{constructor(e=-1,t=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},wl=class extends Aa{constructor(){super(new ai(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ir=class extends er{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Vt.DEFAULT_UP),this.updateMatrix(),this.target=new Vt,this.shadow=new wl}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Hi=-90,Wi=1,Ca=class extends Vt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Jt(Hi,Wi,e,t);i.layers=this.layers,this.add(i);let r=new Jt(Hi,Wi,e,t);r.layers=this.layers,this.add(r);let a=new Jt(Hi,Wi,e,t);a.layers=this.layers,this.add(a);let o=new Jt(Hi,Wi,e,t);o.layers=this.layers,this.add(o);let l=new Jt(Hi,Wi,e,t);l.layers=this.layers,this.add(l);let c=new Jt(Hi,Wi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===mn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Yi)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,u]=this.children,h=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(n,0,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,f,d),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Ra=class extends Jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var jl="\\[\\]\\.:\\/",Gd=new RegExp("["+jl+"]","g"),Ql="[^"+jl+"]",kd="[^"+jl.replace("\\.","")+"]",Hd=/((?:WC+[\/:])*)/.source.replace("WC",Ql),Wd=/(WCOD+)?/.source.replace("WCOD",kd),Xd=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ql),qd=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ql),Yd=new RegExp("^"+Hd+Wd+Xd+qd+"$"),Zd=["material","materials","bones","map"],El=class{constructor(e,t,n){let i=n||xt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},xt=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Gd,"")}static parseTrackName(e){let t=Yd.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);Zd.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Oe("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Fe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Fe("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Fe("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Fe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Fe("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Fe("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Fe("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[i];if(a===void 0){let c=t.nodeName;Fe("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){Fe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Fe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};xt.Composite=El;xt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};xt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};xt.prototype.GetterByBindingType=[xt.prototype._getValue_direct,xt.prototype._getValue_array,xt.prototype._getValue_arrayElement,xt.prototype._getValue_toArray];xt.prototype.SetterByBindingTypeAndVersioning=[[xt.prototype._setValue_direct,xt.prototype._setValue_direct_setNeedsUpdate,xt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_array,xt.prototype._setValue_array_setNeedsUpdate,xt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_arrayElement,xt.prototype._setValue_arrayElement_setNeedsUpdate,xt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_fromArray,xt.prototype._setValue_fromArray_setNeedsUpdate,xt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var A_=new Float32Array(1);var Sh=new tt,sr=class{constructor(e,t,n=0,i=1/0){this.ray=new Os(e,t),this.near=n,this.far=i,this.camera=null,this.layers=new $i,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Fe("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Sh.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Sh),this}intersectObject(e,t=!0,n=[]){return Tl(e,this,n,t),n.sort(wh),n}intersectObjects(e,t=!0,n=[]){for(let i=0,r=e.length;i<r;i++)Tl(e[i],this,n,t);return n.sort(wh),n}};function wh(s,e){return s.distance-e.distance}function Tl(s,e,t,n){let i=!0;if(s.layers.test(e.layers)&&s.raycast(e,t)===!1&&(i=!1),i===!0&&n===!0){let r=s.children;for(let a=0,o=r.length;a<o;a++)Tl(r[a],e,t,!0)}}var rc=class rc{constructor(e,t,n,i){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,i){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=i,this}};rc.prototype.isMatrix2=!0;var Al=rc;function ec(s,e,t,n){let i=Jd(n);switch(t){case ql:return s*e;case Ba:return s*e/i.components*i.byteLength;case za:return s*e/i.components*i.byteLength;case hi:return s*e*2/i.components*i.byteLength;case Va:return s*e*2/i.components*i.byteLength;case Yl:return s*e*3/i.components*i.byteLength;case hn:return s*e*4/i.components*i.byteLength;case Ga:return s*e*4/i.components*i.byteLength;case or:case lr:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case cr:case hr:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Ha:case Xa:return Math.max(s,16)*Math.max(e,8)/4;case ka:case Wa:return Math.max(s,8)*Math.max(e,8)/2;case qa:case Ya:case Ja:case $a:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case Za:case ur:case Ka:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case ja:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Qa:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case eo:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case to:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case no:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case io:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case so:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case ro:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case ao:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case oo:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case lo:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case co:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case ho:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case uo:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case fo:case po:case mo:return Math.ceil(s/4)*Math.ceil(e/4)*16;case go:case xo:return Math.ceil(s/4)*Math.ceil(e/4)*8;case fr:case _o:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Jd(s){switch(s){case Kt:case kl:return{byteLength:1,components:1};case as:case Hl:case yn:return{byteLength:2,components:1};case Fa:case Oa:return{byteLength:2,components:4};case vn:case Ua:case cn:return{byteLength:4,components:1};case Wl:case Xl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Oe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function Bu(){let s=null,e=!1,t=null,n=null;function i(r,a){n=s.requestAnimationFrame(i),t(r,a)}return{start:function(){e!==!0&&t!==null&&s!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function np(s){let e=new WeakMap;function t(o,l){let c=o.array,u=o.usage,h=c.byteLength,f=s.createBuffer();s.bindBuffer(l,f),s.bufferData(l,c,u),o.onUploadCallback();let d;if(c instanceof Float32Array)d=s.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=s.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=s.HALF_FLOAT:d=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=s.SHORT;else if(c instanceof Uint32Array)d=s.UNSIGNED_INT;else if(c instanceof Int32Array)d=s.INT;else if(c instanceof Int8Array)d=s.BYTE;else if(c instanceof Uint8Array)d=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:h}}function n(o,l,c){let u=l.array,h=l.updateRanges;if(s.bindBuffer(c,o),h.length===0)s.bufferSubData(c,0,u);else{h.sort((d,g)=>d.start-g.start);let f=0;for(let d=1;d<h.length;d++){let g=h[f],x=h[d];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++f,h[f]=x)}h.length=f+1;for(let d=0,g=h.length;d<g;d++){let x=h[d];s.bufferSubData(c,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(s.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:r,update:a}}var ip=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,sp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,rp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ap=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,op=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,lp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,cp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,hp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,up=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,fp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,dp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,pp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,mp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,gp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,xp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,_p=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,vp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,yp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Mp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,bp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Sp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,wp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Ep=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Tp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ap=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Cp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Rp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ip=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Pp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Lp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Dp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Np=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Up=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Fp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Op=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Bp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,zp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Vp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Gp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,kp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Hp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Wp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Xp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,qp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Yp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Zp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Jp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,$p=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Kp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,jp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Qp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,em=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,tm=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,nm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,im=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,sm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,rm=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,am=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,om=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,lm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,cm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,hm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,um=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,fm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,dm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,pm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,mm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,gm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,xm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,_m=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ym=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Mm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,bm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Sm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Em=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Tm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Am=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Cm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Rm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Im=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Pm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Lm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Dm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Nm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Um=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Fm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Om=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Bm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,zm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Vm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Gm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,km=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Hm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Wm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Xm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,qm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Ym=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Jm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$m=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Km=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,jm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Qm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,e0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,t0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,n0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,i0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,s0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,r0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,a0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,o0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,l0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,c0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,h0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,u0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,f0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,d0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,p0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,m0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,g0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,x0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,_0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,v0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,y0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,M0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,b0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,S0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,w0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,E0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,T0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,A0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,C0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,R0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,I0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,P0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,L0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,D0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,N0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,U0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,F0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ze={alphahash_fragment:ip,alphahash_pars_fragment:sp,alphamap_fragment:rp,alphamap_pars_fragment:ap,alphatest_fragment:op,alphatest_pars_fragment:lp,aomap_fragment:cp,aomap_pars_fragment:hp,batching_pars_vertex:up,batching_vertex:fp,begin_vertex:dp,beginnormal_vertex:pp,bsdfs:mp,iridescence_fragment:gp,bumpmap_pars_fragment:xp,clipping_planes_fragment:_p,clipping_planes_pars_fragment:vp,clipping_planes_pars_vertex:yp,clipping_planes_vertex:Mp,color_fragment:bp,color_pars_fragment:Sp,color_pars_vertex:wp,color_vertex:Ep,common:Tp,cube_uv_reflection_fragment:Ap,defaultnormal_vertex:Cp,displacementmap_pars_vertex:Rp,displacementmap_vertex:Ip,emissivemap_fragment:Pp,emissivemap_pars_fragment:Lp,colorspace_fragment:Dp,colorspace_pars_fragment:Np,envmap_fragment:Up,envmap_common_pars_fragment:Fp,envmap_pars_fragment:Op,envmap_pars_vertex:Bp,envmap_physical_pars_fragment:Jp,envmap_vertex:zp,fog_vertex:Vp,fog_pars_vertex:Gp,fog_fragment:kp,fog_pars_fragment:Hp,gradientmap_pars_fragment:Wp,lightmap_pars_fragment:Xp,lights_lambert_fragment:qp,lights_lambert_pars_fragment:Yp,lights_pars_begin:Zp,lights_toon_fragment:$p,lights_toon_pars_fragment:Kp,lights_phong_fragment:jp,lights_phong_pars_fragment:Qp,lights_physical_fragment:em,lights_physical_pars_fragment:tm,lights_fragment_begin:nm,lights_fragment_maps:im,lights_fragment_end:sm,lightprobes_pars_fragment:rm,logdepthbuf_fragment:am,logdepthbuf_pars_fragment:om,logdepthbuf_pars_vertex:lm,logdepthbuf_vertex:cm,map_fragment:hm,map_pars_fragment:um,map_particle_fragment:fm,map_particle_pars_fragment:dm,metalnessmap_fragment:pm,metalnessmap_pars_fragment:mm,morphinstance_vertex:gm,morphcolor_vertex:xm,morphnormal_vertex:_m,morphtarget_pars_vertex:vm,morphtarget_vertex:ym,normal_fragment_begin:Mm,normal_fragment_maps:bm,normal_pars_fragment:Sm,normal_pars_vertex:wm,normal_vertex:Em,normalmap_pars_fragment:Tm,clearcoat_normal_fragment_begin:Am,clearcoat_normal_fragment_maps:Cm,clearcoat_pars_fragment:Rm,iridescence_pars_fragment:Im,opaque_fragment:Pm,packing:Lm,premultiplied_alpha_fragment:Dm,project_vertex:Nm,dithering_fragment:Um,dithering_pars_fragment:Fm,roughnessmap_fragment:Om,roughnessmap_pars_fragment:Bm,shadowmap_pars_fragment:zm,shadowmap_pars_vertex:Vm,shadowmap_vertex:Gm,shadowmask_pars_fragment:km,skinbase_vertex:Hm,skinning_pars_vertex:Wm,skinning_vertex:Xm,skinnormal_vertex:qm,specularmap_fragment:Ym,specularmap_pars_fragment:Zm,tonemapping_fragment:Jm,tonemapping_pars_fragment:$m,transmission_fragment:Km,transmission_pars_fragment:jm,uv_pars_fragment:Qm,uv_pars_vertex:e0,uv_vertex:t0,worldpos_vertex:n0,background_vert:i0,background_frag:s0,backgroundCube_vert:r0,backgroundCube_frag:a0,cube_vert:o0,cube_frag:l0,depth_vert:c0,depth_frag:h0,distance_vert:u0,distance_frag:f0,equirect_vert:d0,equirect_frag:p0,linedashed_vert:m0,linedashed_frag:g0,meshbasic_vert:x0,meshbasic_frag:_0,meshlambert_vert:v0,meshlambert_frag:y0,meshmatcap_vert:M0,meshmatcap_frag:b0,meshnormal_vert:S0,meshnormal_frag:w0,meshphong_vert:E0,meshphong_frag:T0,meshphysical_vert:A0,meshphysical_frag:C0,meshtoon_vert:R0,meshtoon_frag:I0,points_vert:P0,points_frag:L0,shadow_vert:D0,shadow_frag:N0,sprite_vert:U0,sprite_frag:F0},ge={common:{diffuse:{value:new Be(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ke}},envmap:{envMap:{value:null},envMapRotation:{value:new ke},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ke},normalScale:{value:new oe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Be(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new D},probesMax:{value:new D},probesResolution:{value:new D}},points:{diffuse:{value:new Be(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0},uvTransform:{value:new ke}},sprite:{diffuse:{value:new Be(16777215)},opacity:{value:1},center:{value:new oe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}}},Dn={basic:{uniforms:Gt([ge.common,ge.specularmap,ge.envmap,ge.aomap,ge.lightmap,ge.fog]),vertexShader:Ze.meshbasic_vert,fragmentShader:Ze.meshbasic_frag},lambert:{uniforms:Gt([ge.common,ge.specularmap,ge.envmap,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.fog,ge.lights,{emissive:{value:new Be(0)},envMapIntensity:{value:1}}]),vertexShader:Ze.meshlambert_vert,fragmentShader:Ze.meshlambert_frag},phong:{uniforms:Gt([ge.common,ge.specularmap,ge.envmap,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.fog,ge.lights,{emissive:{value:new Be(0)},specular:{value:new Be(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ze.meshphong_vert,fragmentShader:Ze.meshphong_frag},standard:{uniforms:Gt([ge.common,ge.envmap,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.roughnessmap,ge.metalnessmap,ge.fog,ge.lights,{emissive:{value:new Be(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag},toon:{uniforms:Gt([ge.common,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.gradientmap,ge.fog,ge.lights,{emissive:{value:new Be(0)}}]),vertexShader:Ze.meshtoon_vert,fragmentShader:Ze.meshtoon_frag},matcap:{uniforms:Gt([ge.common,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.fog,{matcap:{value:null}}]),vertexShader:Ze.meshmatcap_vert,fragmentShader:Ze.meshmatcap_frag},points:{uniforms:Gt([ge.points,ge.fog]),vertexShader:Ze.points_vert,fragmentShader:Ze.points_frag},dashed:{uniforms:Gt([ge.common,ge.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ze.linedashed_vert,fragmentShader:Ze.linedashed_frag},depth:{uniforms:Gt([ge.common,ge.displacementmap]),vertexShader:Ze.depth_vert,fragmentShader:Ze.depth_frag},normal:{uniforms:Gt([ge.common,ge.bumpmap,ge.normalmap,ge.displacementmap,{opacity:{value:1}}]),vertexShader:Ze.meshnormal_vert,fragmentShader:Ze.meshnormal_frag},sprite:{uniforms:Gt([ge.sprite,ge.fog]),vertexShader:Ze.sprite_vert,fragmentShader:Ze.sprite_frag},background:{uniforms:{uvTransform:{value:new ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ze.background_vert,fragmentShader:Ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ke}},vertexShader:Ze.backgroundCube_vert,fragmentShader:Ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ze.cube_vert,fragmentShader:Ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ze.equirect_vert,fragmentShader:Ze.equirect_frag},distance:{uniforms:Gt([ge.common,ge.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ze.distance_vert,fragmentShader:Ze.distance_frag},shadow:{uniforms:Gt([ge.lights,ge.fog,{color:{value:new Be(0)},opacity:{value:1}}]),vertexShader:Ze.shadow_vert,fragmentShader:Ze.shadow_frag}};Dn.physical={uniforms:Gt([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ke},clearcoatNormalScale:{value:new oe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ke},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ke},sheen:{value:0},sheenColor:{value:new Be(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ke},transmissionSamplerSize:{value:new oe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ke},attenuationDistance:{value:0},attenuationColor:{value:new Be(0)},specularColor:{value:new Be(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ke},anisotropyVector:{value:new oe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ke}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag};var bo={r:0,b:0,g:0},O0=new tt,zu=new ke;zu.set(-1,0,0,0,1,0,0,0,1);function B0(s,e,t,n,i,r){let a=new Be(0),o=i===!0?0:1,l,c,u=null,h=0,f=null;function d(M){let E=M.isScene===!0?M.background:null;if(E&&E.isTexture){let y=M.backgroundBlurriness>0;E=e.get(E,y)}return E}function g(M){let E=!1,y=d(M);y===null?p(a,o):y&&y.isColor&&(p(y,1),E=!0);let b=s.xr.getEnvironmentBlendMode();b==="additive"?t.buffers.color.setClear(0,0,0,1,r):b==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(s.autoClear||E)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function x(M,E){let y=d(E);y&&(y.isCubeTexture||y.mapping===rr)?(c===void 0&&(c=new We(new dt(1,1,1),new sn({name:"BackgroundCubeMaterial",uniforms:Ei(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:Xt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,w,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(O0.makeRotationFromEuler(E.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(zu),c.material.toneMapped=et.getTransfer(y.colorSpace)!==ot,(u!==y||h!==y.version||f!==s.toneMapping)&&(c.material.needsUpdate=!0,u=y,h=y.version,f=s.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new We(new Rn(2,2),new sn({name:"BackgroundMaterial",uniforms:Ei(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:oi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.toneMapped=et.getTransfer(y.colorSpace)!==ot,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||h!==y.version||f!==s.toneMapping)&&(l.material.needsUpdate=!0,u=y,h=y.version,f=s.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function p(M,E){M.getRGB(bo,Kl(s)),t.buffers.color.setClear(bo.r,bo.g,bo.b,E,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,E=1){a.set(M),o=E,p(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,p(a,o)},render:g,addToRenderList:x,dispose:m}}function z0(s,e){let t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=f(null),r=i,a=!1;function o(I,U,L,P,F){let O=!1,G=h(I,P,L,U);r!==G&&(r=G,c(r.object)),O=d(I,P,L,F),O&&g(I,P,L,F),F!==null&&e.update(F,s.ELEMENT_ARRAY_BUFFER),(O||a)&&(a=!1,y(I,U,L,P),F!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function l(){return s.createVertexArray()}function c(I){return s.bindVertexArray(I)}function u(I){return s.deleteVertexArray(I)}function h(I,U,L,P){let F=P.wireframe===!0,O=n[U.id];O===void 0&&(O={},n[U.id]=O);let G=I.isInstancedMesh===!0?I.id:0,Q=O[G];Q===void 0&&(Q={},O[G]=Q);let k=Q[L.id];k===void 0&&(k={},Q[L.id]=k);let Z=k[F];return Z===void 0&&(Z=f(l()),k[F]=Z),Z}function f(I){let U=[],L=[],P=[];for(let F=0;F<t;F++)U[F]=0,L[F]=0,P[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:L,attributeDivisors:P,object:I,attributes:{},index:null}}function d(I,U,L,P){let F=r.attributes,O=U.attributes,G=0,Q=L.getAttributes();for(let k in Q)if(Q[k].location>=0){let j=F[k],Ee=O[k];if(Ee===void 0&&(k==="instanceMatrix"&&I.instanceMatrix&&(Ee=I.instanceMatrix),k==="instanceColor"&&I.instanceColor&&(Ee=I.instanceColor)),j===void 0||j.attribute!==Ee||Ee&&j.data!==Ee.data)return!0;G++}return r.attributesNum!==G||r.index!==P}function g(I,U,L,P){let F={},O=U.attributes,G=0,Q=L.getAttributes();for(let k in Q)if(Q[k].location>=0){let j=O[k];j===void 0&&(k==="instanceMatrix"&&I.instanceMatrix&&(j=I.instanceMatrix),k==="instanceColor"&&I.instanceColor&&(j=I.instanceColor));let Ee={};Ee.attribute=j,j&&j.data&&(Ee.data=j.data),F[k]=Ee,G++}r.attributes=F,r.attributesNum=G,r.index=P}function x(){let I=r.newAttributes;for(let U=0,L=I.length;U<L;U++)I[U]=0}function p(I){m(I,0)}function m(I,U){let L=r.newAttributes,P=r.enabledAttributes,F=r.attributeDivisors;L[I]=1,P[I]===0&&(s.enableVertexAttribArray(I),P[I]=1),F[I]!==U&&(s.vertexAttribDivisor(I,U),F[I]=U)}function M(){let I=r.newAttributes,U=r.enabledAttributes;for(let L=0,P=U.length;L<P;L++)U[L]!==I[L]&&(s.disableVertexAttribArray(L),U[L]=0)}function E(I,U,L,P,F,O,G){G===!0?s.vertexAttribIPointer(I,U,L,F,O):s.vertexAttribPointer(I,U,L,P,F,O)}function y(I,U,L,P){x();let F=P.attributes,O=L.getAttributes(),G=U.defaultAttributeValues;for(let Q in O){let k=O[Q];if(k.location>=0){let Z=F[Q];if(Z===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(Z=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(Z=I.instanceColor)),Z!==void 0){let j=Z.normalized,Ee=Z.itemSize,ye=e.get(Z);if(ye===void 0)continue;let je=ye.buffer,qe=ye.type,Qe=ye.bytesPerElement,Y=qe===s.INT||qe===s.UNSIGNED_INT||Z.gpuType===Ua;if(Z.isInterleavedBufferAttribute){let te=Z.data,xe=te.stride,ze=Z.offset;if(te.isInstancedInterleavedBuffer){for(let be=0;be<k.locationSize;be++)m(k.location+be,te.meshPerAttribute);I.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let be=0;be<k.locationSize;be++)p(k.location+be);s.bindBuffer(s.ARRAY_BUFFER,je);for(let be=0;be<k.locationSize;be++)E(k.location+be,Ee/k.locationSize,qe,j,xe*Qe,(ze+Ee/k.locationSize*be)*Qe,Y)}else{if(Z.isInstancedBufferAttribute){for(let te=0;te<k.locationSize;te++)m(k.location+te,Z.meshPerAttribute);I.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let te=0;te<k.locationSize;te++)p(k.location+te);s.bindBuffer(s.ARRAY_BUFFER,je);for(let te=0;te<k.locationSize;te++)E(k.location+te,Ee/k.locationSize,qe,j,Ee*Qe,Ee/k.locationSize*te*Qe,Y)}}else if(G!==void 0){let j=G[Q];if(j!==void 0)switch(j.length){case 2:s.vertexAttrib2fv(k.location,j);break;case 3:s.vertexAttrib3fv(k.location,j);break;case 4:s.vertexAttrib4fv(k.location,j);break;default:s.vertexAttrib1fv(k.location,j)}}}}M()}function b(){T();for(let I in n){let U=n[I];for(let L in U){let P=U[L];for(let F in P){let O=P[F];for(let G in O)u(O[G].object),delete O[G];delete P[F]}}delete n[I]}}function w(I){if(n[I.id]===void 0)return;let U=n[I.id];for(let L in U){let P=U[L];for(let F in P){let O=P[F];for(let G in O)u(O[G].object),delete O[G];delete P[F]}}delete n[I.id]}function A(I){for(let U in n){let L=n[U];for(let P in L){let F=L[P];if(F[I.id]===void 0)continue;let O=F[I.id];for(let G in O)u(O[G].object),delete O[G];delete F[I.id]}}}function v(I){for(let U in n){let L=n[U],P=I.isInstancedMesh===!0?I.id:0,F=L[P];if(F!==void 0){for(let O in F){let G=F[O];for(let Q in G)u(G[Q].object),delete G[Q];delete F[O]}delete L[P],Object.keys(L).length===0&&delete n[U]}}}function T(){R(),a=!0,r!==i&&(r=i,c(r.object))}function R(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:T,resetDefaultState:R,dispose:b,releaseStatesOfGeometry:w,releaseStatesOfObject:v,releaseStatesOfProgram:A,initAttributes:x,enableAttribute:p,disableUnusedAttributes:M}}function V0(s,e,t){let n;function i(l){n=l}function r(l,c){s.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,u){u!==0&&(s.drawArraysInstanced(n,l,c,u),t.update(c,n,u))}function o(l,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,u);let f=0;for(let d=0;d<u;d++)f+=c[d];t.update(f,n,1)}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function G0(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(A){return!(A!==hn&&n.convert(A)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(A){let v=A===yn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==Kt&&A!==cn&&!v&&n.convert(A)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE))}function l(A){if(A==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(Oe("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let h=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&f===!1&&Oe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let d=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),g=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=s.getParameter(s.MAX_TEXTURE_SIZE),p=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),m=s.getParameter(s.MAX_VERTEX_ATTRIBS),M=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),E=s.getParameter(s.MAX_VARYING_VECTORS),y=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),b=s.getParameter(s.MAX_SAMPLES),w=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:M,maxVaryings:E,maxFragmentUniforms:y,maxSamples:b,samples:w}}function k0(s){let e=this,t=null,n=0,i=!1,r=!1,a=new en,o=new ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f){let d=h.length!==0||f||n!==0||i;return i=f,n=h.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,f){t=u(h,f,0)},this.setState=function(h,f,d){let g=h.clippingPlanes,x=h.clipIntersection,p=h.clipShadows,m=s.get(h);if(!i||g===null||g.length===0||r&&!p)r?u(null):c();else{let M=r?0:n,E=M*4,y=m.clippingState||null;l.value=y,y=u(g,f,E,d);for(let b=0;b!==E;++b)y[b]=t[b];m.clippingState=y,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,f,d,g){let x=h!==null?h.length:0,p=null;if(x!==0){if(p=l.value,g!==!0||p===null){let m=d+x*4,M=f.matrixWorldInverse;o.getNormalMatrix(M),(p===null||p.length<m)&&(p=new Float32Array(m));for(let E=0,y=d;E!==x;++E,y+=4)a.copy(h[E]).applyMatrix4(M,o),a.normal.toArray(p,y),p[y+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}var hs=4,H0=6,W0=20,X0=256,dr=new ai,xu=new Be,ac=null,oc=0,lc=0,cc=!1,q0=new D,Ti=new D,wo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,i=100,r={}){let{size:a=256,position:o=q0}=r;ac=this._renderer.getRenderTarget(),oc=this._renderer.getActiveCubeFace(),lc=this._renderer.getActiveMipmapLevel(),cc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,i,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=yu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=vu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(ac,oc,lc),this._renderer.xr.enabled=cc,e.scissorTest=!1,cs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===li||e.mapping===wi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ac=this._renderer.getRenderTarget(),oc=this._renderer.getActiveCubeFace(),lc=this._renderer.getActiveMipmapLevel(),cc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Rt,minFilter:Rt,generateMipmaps:!1,type:yn,format:hn,colorSpace:Is,depthBuffer:!1},i=_u(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=_u(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Y0(r)),this._blurMaterial=J0(r,e,t),this._ggxMaterial=Z0(r,e,t)}return i}_compileMaterial(e){let t=new We(new Et,e);this._renderer.compile(t,dr)}_sceneToCubeUV(e,t,n,i,r){let l=new Jt(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,f=h.autoClear,d=h.toneMapping;h.getClearColor(xu),h.toneMapping=_n,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(i),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new We(new dt,new Tt({name:"PMREM.Background",side:Xt,depthWrite:!1,depthTest:!1})));let x=this._backgroundBox,p=x.material,m=!1,M=e.background;M?M.isColor&&(p.color.copy(M),e.background=null,m=!0):(p.color.copy(xu),m=!0);for(let E=0;E<6;E++){let y=E%3;y===0?(l.up.set(0,c[E],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[E],r.y,r.z)):y===1?(l.up.set(0,0,c[E]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[E],r.z)):(l.up.set(0,c[E],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[E]));let b=this._cubeSize;cs(i,y*b,E>2?b:0,b,b),h.setRenderTarget(i),m&&h.render(x,l),h.render(e,l)}h.toneMapping=d,h.autoClear=f,e.background=M}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===li||e.mapping===wi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=yu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=vu());let r=i?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;cs(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,dr)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodMeshes.length;for(let r=1;r<i;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let i=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),h=Math.sqrt(c*c-u*u),f=c*1.25,d=h*f,{_lodMax:g}=this,x=this._sizeLods[n],p=3*x*(n>g-hs?n-g+hs:0),m=4*(this._cubeSize-x);l.envMap.value=e.texture,l.roughness.value=d,l.mipInt.value=g-t,cs(r,p,m,3*x,2*x),i.setRenderTarget(r),i.render(o,dr),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-n,cs(e,p,m,3*x,2*x),i.setRenderTarget(e),i.render(o,dr)}_blur(e,t,n,i){let r=this._pingPongRenderTarget,a=Math.min(i,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,a),this._blurPass(r,e,n,n,a)}_blurPass(e,t,n,i,r){let a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[i];l.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-n;let u=this._sizeLods[i],h=3*u*(i>this._lodMax-hs?i-this._lodMax+hs:0),f=4*(this._cubeSize-u);cs(t,h,f,3*u,2*u),a.setRenderTarget(t),a.render(l,dr)}};function Y0(s){let e=[],t=[],n=s,i=s-hs+1+H0;for(let r=0;r<i;r++){let a=Math.pow(2,n);e.push(a);let o=1/(a-2),l=-o,c=1+o,u=[l,l,c,l,c,c,l,l,c,c,l,c],h=6,f=6,d=3,g=new Float32Array(d*f*h),x=new Float32Array(d*f*h);for(let m=0;m<h;m++){let M=m%3*2/3-1,E=m>2?0:-1,y=[M,E,0,M+2/3,E,0,M+2/3,E+1,0,M,E,0,M+2/3,E+1,0,M,E+1,0];g.set(y,d*f*m);for(let b=0;b<f;b++){let w=u[b*2]*2-1,A=u[b*2+1]*2-1;m===0?Ti.set(1,A,w):m===1?Ti.set(-w,1,-A):m===2?Ti.set(-w,A,1):m===3?Ti.set(-1,A,-w):m===4?Ti.set(-w,-1,A):Ti.set(w,A,-1),Ti.toArray(x,(m*f+b)*d)}}let p=new Et;p.setAttribute("position",new Ut(g,d)),p.setAttribute("outputDirection",new Ut(x,d)),t.push(new We(p,null)),n>hs&&n--}return{lodMeshes:t,sizeLods:e}}function _u(s,e,t){let n=new $t(s,e,t);return n.texture.mapping=rr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function cs(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function Z0(s,e,t){return new sn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:X0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ao(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function J0(s,e,t){return new sn({name:"SphericalGaussianBlur",defines:{SAMPLES:W0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Ao(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function vu(){return new sn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ao(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function yu(){return new sn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ao(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function Ao(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Eo=class extends $t{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new zs(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new dt(5,5,5),r=new sn({name:"CubemapFromEquirect",uniforms:Ei(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Xt,blending:In});r.uniforms.tEquirect.value=t;let a=new We(i,r),o=t.minFilter;return t.minFilter===Pn&&(t.minFilter=Rt),new Ca(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(r)}};function $0(s){let e=new WeakMap,t=new WeakMap,n=null;function i(f,d=!1){return f==null?null:d?a(f):r(f)}function r(f){if(f&&f.isTexture){let d=f.mapping;if(d===La||d===Da)if(e.has(f)){let g=e.get(f).texture;return o(g,f.mapping)}else{let g=f.image;if(g&&g.height>0){let x=new Eo(g.height);return x.fromEquirectangularTexture(s,f),e.set(f,x),f.addEventListener("dispose",c),o(x.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture){let d=f.mapping,g=d===La||d===Da,x=d===li||d===wi;if(g||x){let p=t.get(f),m=p!==void 0?p.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==m)return n===null&&(n=new wo(s)),p=g?n.fromEquirectangular(f,p):n.fromCubemap(f,p),p.texture.pmremVersion=f.pmremVersion,t.set(f,p),p.texture;if(p!==void 0)return p.texture;{let M=f.image;return g&&M&&M.height>0||x&&M&&l(M)?(n===null&&(n=new wo(s)),p=g?n.fromEquirectangular(f):n.fromCubemap(f),p.texture.pmremVersion=f.pmremVersion,t.set(f,p),f.addEventListener("dispose",u),p.texture):null}}}return f}function o(f,d){return d===La?f.mapping=li:d===Da&&(f.mapping=wi),f}function l(f){let d=0,g=6;for(let x=0;x<g;x++)f[x]!==void 0&&d++;return d===g}function c(f){let d=f.target;d.removeEventListener("dispose",c);let g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function u(f){let d=f.target;d.removeEventListener("dispose",u);let g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function h(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:h}}function K0(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i=s.getExtension(n);return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let i=t(n);return i===null&&xi("WebGLRenderer: "+n+" extension not supported."),i}}}function j0(s,e,t,n){let i={},r=new WeakMap;function a(h){let f=h.target;f.index!==null&&e.remove(f.index);for(let g in f.attributes)e.remove(f.attributes[g]);f.removeEventListener("dispose",a),delete i[f.id];let d=r.get(f);d&&(e.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function o(h,f){return i[f.id]===!0||(f.addEventListener("dispose",a),i[f.id]=!0,t.memory.geometries++),f}function l(h){let f=h.attributes;for(let d in f)e.update(f[d],s.ARRAY_BUFFER)}function c(h){let f=[],d=h.index,g=h.attributes.position,x=0;if(g===void 0)return;if(d!==null){let M=d.array;x=d.version;for(let E=0,y=M.length;E<y;E+=3){let b=M[E+0],w=M[E+1],A=M[E+2];f.push(b,w,w,A,A,b)}}else{let M=g.array;x=g.version;for(let E=0,y=M.length/3-1;E<y;E+=3){let b=E+0,w=E+1,A=E+2;f.push(b,w,w,A,A,b)}}let p=new(g.count>=65535?Fs:Us)(f,1);p.version=x;let m=r.get(h);m&&e.remove(m),r.set(h,p)}function u(h){let f=r.get(h);if(f){let d=h.index;d!==null&&f.version<d.version&&c(h)}else c(h);return r.get(h)}return{get:o,update:l,getWireframeAttribute:u}}function Q0(s,e,t){let n;function i(h){n=h}let r,a;function o(h){r=h.type,a=h.bytesPerElement}function l(h,f){s.drawElements(n,f,r,h*a),t.update(f,n,1)}function c(h,f,d){d!==0&&(s.drawElementsInstanced(n,f,r,h*a,d),t.update(f,n,d))}function u(h,f,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,h,0,d);let x=0;for(let p=0;p<d;p++)x+=f[p];t.update(x,n,1)}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function eg(s){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case s.TRIANGLES:t.triangles+=o*(r/3);break;case s.LINES:t.lines+=o*(r/2);break;case s.LINE_STRIP:t.lines+=o*(r-1);break;case s.LINE_LOOP:t.lines+=o*r;break;case s.POINTS:t.points+=o*r;break;default:Fe("WebGLInfo: Unknown draw mode:",a);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function tg(s,e,t){let n=new WeakMap,i=new vt;function r(a,o,l){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,h=u!==void 0?u.length:0,f=n.get(o);if(f===void 0||f.count!==h){let T=function(){A.dispose(),n.delete(o),o.removeEventListener("dispose",T)};f!==void 0&&f.texture.dispose();let d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],M=o.morphAttributes.color||[],E=0;d===!0&&(E=1),g===!0&&(E=2),x===!0&&(E=3);let y=o.attributes.position.count*E,b=1;y>e.maxTextureSize&&(b=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let w=new Float32Array(y*b*4*h),A=new Ds(w,y,b,h);A.type=cn,A.needsUpdate=!0;let v=E*4;for(let R=0;R<h;R++){let I=p[R],U=m[R],L=M[R],P=y*b*4*R;for(let F=0;F<I.count;F++){let O=F*v;d===!0&&(i.fromBufferAttribute(I,F),w[P+O+0]=i.x,w[P+O+1]=i.y,w[P+O+2]=i.z,w[P+O+3]=0),g===!0&&(i.fromBufferAttribute(U,F),w[P+O+4]=i.x,w[P+O+5]=i.y,w[P+O+6]=i.z,w[P+O+7]=0),x===!0&&(i.fromBufferAttribute(L,F),w[P+O+8]=i.x,w[P+O+9]=i.y,w[P+O+10]=i.z,w[P+O+11]=L.itemSize===4?i.w:1)}}f={count:h,texture:A,size:new oe(y,b)},n.set(o,f),o.addEventListener("dispose",T)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,t);else{let d=0;for(let x=0;x<c.length;x++)d+=c[x];let g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(s,"morphTargetBaseInfluence",g),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(s,"morphTargetsTextureSize",f.size)}return{update:r}}function ng(s,e,t,n,i){let r=new WeakMap;function a(c){let u=i.render.frame,h=c.geometry,f=e.get(c,h);if(r.get(f)!==u&&(e.update(f),r.set(f,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(t.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,s.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){let d=c.skeleton;r.get(d)!==u&&(d.update(),r.set(d,u))}return f}function o(){r=new WeakMap}function l(c){let u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}var ig={[Nl]:"LINEAR_TONE_MAPPING",[Ul]:"REINHARD_TONE_MAPPING",[Fl]:"CINEON_TONE_MAPPING",[Ol]:"ACES_FILMIC_TONE_MAPPING",[zl]:"AGX_TONE_MAPPING",[Vl]:"NEUTRAL_TONE_MAPPING",[Bl]:"CUSTOM_TONE_MAPPING"};function sg(s,e,t,n,i,r){let a=new $t(e,t,{type:s,depthBuffer:i,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new Et;c.setAttribute("position",new it([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new it([0,2,0,0,2,0],2));let u=new pa({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new We(c,u),f=new ai(-1,1,1,-1,0,1),d=null,g=null,x=!1,p,m=null,M=[],E=!1;this.setSize=function(y,b){a.setSize(y,b),o!==null&&o.setSize(y,b),l!==null&&l.setSize(y,b);for(let w=0;w<M.length;w++){let A=M[w];A.setSize&&A.setSize(y,b)}},this.setEffects=function(y){M=y,E=M.length>0&&M[0].isRenderPass===!0;let b=a.width,w=a.height;M.length>0&&o===null&&(o=new $t(b,w,{type:yn,depthBuffer:!1,stencilBuffer:!1}),l=new $t(b,w,{type:yn,depthBuffer:!1,stencilBuffer:!1}));for(let A=0;A<M.length;A++){let v=M[A];v.setSize&&v.setSize(b,w)}},this.begin=function(y,b){if(x||y.toneMapping===_n&&M.length===0)return!1;if(m=b,b!==null){let w=b.width,A=b.height;(a.width!==w||a.height!==A)&&this.setSize(w,A)}return E===!1&&y.setRenderTarget(a),p=y.toneMapping,y.toneMapping=_n,!0},this.hasRenderPass=function(){return E},this.end=function(y,b){y.toneMapping=p,x=!0;let w=a,A=o;for(let v=0;v<M.length;v++){let T=M[v];T.enabled!==!1&&(T.render(y,A,w,b),T.needsSwap!==!1&&(w=A,A=A===o?l:o))}if(d!==y.outputColorSpace||g!==y.toneMapping){d=y.outputColorSpace,g=y.toneMapping,u.defines={},et.getTransfer(d)===ot&&(u.defines.SRGB_TRANSFER="");let v=ig[g];v&&(u.defines[v]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=w.texture,y.setRenderTarget(m),y.render(h,f),m=null,x=!1},this.isCompositing=function(){return x},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}var Vu=new Wt,fc=new ni(1,1),Gu=new Ds,ku=new aa,Hu=new zs,Mu=[],bu=[],Su=new Float32Array(16),wu=new Float32Array(9),Eu=new Float32Array(4);function fs(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=Mu[i];if(r===void 0&&(r=new Float32Array(i),Mu[i]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,s[a].toArray(r,o)}return r}function It(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Pt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Co(s,e){let t=bu[e];t===void 0&&(t=new Int32Array(e),bu[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function rg(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function ag(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;s.uniform2fv(this.addr,e),Pt(t,e)}}function og(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(It(t,e))return;s.uniform3fv(this.addr,e),Pt(t,e)}}function lg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;s.uniform4fv(this.addr,e),Pt(t,e)}}function cg(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Pt(t,e)}else{if(It(t,n))return;Eu.set(n),s.uniformMatrix2fv(this.addr,!1,Eu),Pt(t,n)}}function hg(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Pt(t,e)}else{if(It(t,n))return;wu.set(n),s.uniformMatrix3fv(this.addr,!1,wu),Pt(t,n)}}function ug(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Pt(t,e)}else{if(It(t,n))return;Su.set(n),s.uniformMatrix4fv(this.addr,!1,Su),Pt(t,n)}}function fg(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function dg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;s.uniform2iv(this.addr,e),Pt(t,e)}}function pg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;s.uniform3iv(this.addr,e),Pt(t,e)}}function mg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;s.uniform4iv(this.addr,e),Pt(t,e)}}function gg(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function xg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;s.uniform2uiv(this.addr,e),Pt(t,e)}}function _g(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;s.uniform3uiv(this.addr,e),Pt(t,e)}}function vg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;s.uniform4uiv(this.addr,e),Pt(t,e)}}function yg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(fc.compareFunction=t.isReversedDepthBuffer()?Mo:yo,r=fc):r=Vu,t.setTexture2D(e||r,i)}function Mg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||ku,i)}function bg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Hu,i)}function Sg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Gu,i)}function wg(s){switch(s){case 5126:return rg;case 35664:return ag;case 35665:return og;case 35666:return lg;case 35674:return cg;case 35675:return hg;case 35676:return ug;case 5124:case 35670:return fg;case 35667:case 35671:return dg;case 35668:case 35672:return pg;case 35669:case 35673:return mg;case 5125:return gg;case 36294:return xg;case 36295:return _g;case 36296:return vg;case 35678:case 36198:case 36298:case 36306:case 35682:return yg;case 35679:case 36299:case 36307:return Mg;case 35680:case 36300:case 36308:case 36293:return bg;case 36289:case 36303:case 36311:case 36292:return Sg}}function Eg(s,e){s.uniform1fv(this.addr,e)}function Tg(s,e){let t=fs(e,this.size,2);s.uniform2fv(this.addr,t)}function Ag(s,e){let t=fs(e,this.size,3);s.uniform3fv(this.addr,t)}function Cg(s,e){let t=fs(e,this.size,4);s.uniform4fv(this.addr,t)}function Rg(s,e){let t=fs(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function Ig(s,e){let t=fs(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function Pg(s,e){let t=fs(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function Lg(s,e){s.uniform1iv(this.addr,e)}function Dg(s,e){s.uniform2iv(this.addr,e)}function Ng(s,e){s.uniform3iv(this.addr,e)}function Ug(s,e){s.uniform4iv(this.addr,e)}function Fg(s,e){s.uniform1uiv(this.addr,e)}function Og(s,e){s.uniform2uiv(this.addr,e)}function Bg(s,e){s.uniform3uiv(this.addr,e)}function zg(s,e){s.uniform4uiv(this.addr,e)}function Vg(s,e,t){let n=this.cache,i=e.length,r=Co(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Pt(n,r));let a;this.type===s.SAMPLER_2D_SHADOW?a=fc:a=Vu;for(let o=0;o!==i;++o)t.setTexture2D(e[o]||a,r[o])}function Gg(s,e,t){let n=this.cache,i=e.length,r=Co(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Pt(n,r));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||ku,r[a])}function kg(s,e,t){let n=this.cache,i=e.length,r=Co(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Pt(n,r));for(let a=0;a!==i;++a)t.setTextureCube(e[a]||Hu,r[a])}function Hg(s,e,t){let n=this.cache,i=e.length,r=Co(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Pt(n,r));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||Gu,r[a])}function Wg(s){switch(s){case 5126:return Eg;case 35664:return Tg;case 35665:return Ag;case 35666:return Cg;case 35674:return Rg;case 35675:return Ig;case 35676:return Pg;case 5124:case 35670:return Lg;case 35667:case 35671:return Dg;case 35668:case 35672:return Ng;case 35669:case 35673:return Ug;case 5125:return Fg;case 36294:return Og;case 36295:return Bg;case 36296:return zg;case 35678:case 36198:case 36298:case 36306:case 35682:return Vg;case 35679:case 36299:case 36307:return Gg;case 35680:case 36300:case 36308:case 36293:return kg;case 36289:case 36303:case 36311:case 36292:return Hg}}var dc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=wg(t.type)}},pc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Wg(t.type)}},mc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,a=i.length;r!==a;++r){let o=i[r];o.setValue(e,t[o.id],n)}}},hc=/(\w+)(\])?(\[|\.)?/g;function Tu(s,e){s.seq.push(e),s.map[e.id]=e}function Xg(s,e,t){let n=s.name,i=n.length;for(hc.lastIndex=0;;){let r=hc.exec(n),a=hc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){Tu(t,c===void 0?new dc(o,s,e):new pc(o,s,e));break}else{let h=t.map[o];h===void 0&&(h=new mc(o),Tu(t,h)),t=h}}}var us=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);Xg(o,l,this)}let i=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?i.push(a):r.push(a);i.length>0&&(this.seq=i.concat(r))}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let a=e[i];a.id in t&&n.push(a)}return n}};function Au(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}var qg=37297,Yg=0;function Zg(s,e){let t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=i;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var Cu=new ke;function Jg(s){et._getMatrix(Cu,et.workingColorSpace,s);let e=`mat3( ${Cu.elements.map(t=>t.toFixed(4))} )`;switch(et.getTransfer(s)){case Ps:return[e,"LinearTransferOETF"];case ot:return[e,"sRGBTransferOETF"];default:return Oe("WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function Ru(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+Zg(s.getShaderSource(e),o)}else return r}function $g(s,e){let t=Jg(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var Kg={[Nl]:"Linear",[Ul]:"Reinhard",[Fl]:"Cineon",[Ol]:"ACESFilmic",[zl]:"AgX",[Vl]:"Neutral",[Bl]:"Custom"};function jg(s,e){let t=Kg[e];return t===void 0?(Oe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var So=new D;function Qg(){et.getLuminanceCoefficients(So);let s=So.x.toFixed(4),e=So.y.toFixed(4),t=So.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ex(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(mr).join(`
`)}function tx(s){let e=[];for(let t in s){let n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function nx(s,e){let t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(e,i),a=r.name,o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:s.getAttribLocation(e,a),locationSize:o}}return t}function mr(s){return s!==""}function Iu(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Pu(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var ix=/^[ \t]*#include +<([\w\d./]+)>/gm;function gc(s){return s.replace(ix,rx)}var sx=new Map;function rx(s,e){let t=Ze[e];if(t===void 0){let n=sx.get(e);if(n!==void 0)t=Ze[n],Oe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return gc(t)}var ax=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Lu(s){return s.replace(ax,ox)}function ox(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Du(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var lx={[bi]:"SHADOWMAP_TYPE_PCF",[ss]:"SHADOWMAP_TYPE_VSM"};function cx(s){return lx[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var hx={[li]:"ENVMAP_TYPE_CUBE",[wi]:"ENVMAP_TYPE_CUBE",[rr]:"ENVMAP_TYPE_CUBE_UV"};function ux(s){return s.envMap===!1?"ENVMAP_TYPE_CUBE":hx[s.envMapMode]||"ENVMAP_TYPE_CUBE"}var fx={[wi]:"ENVMAP_MODE_REFRACTION"};function dx(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":fx[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}var px={[Pa]:"ENVMAP_BLENDING_MULTIPLY",[qh]:"ENVMAP_BLENDING_MIX",[Yh]:"ENVMAP_BLENDING_ADD"};function mx(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":px[s.combine]||"ENVMAP_BLENDING_NONE"}function gx(s){let e=s.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function xx(s,e,t,n){let i=s.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=cx(t),c=ux(t),u=dx(t),h=mx(t),f=gx(t),d=ex(t),g=tx(r),x=i.createProgram(),p,m,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(mr).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(mr).join(`
`),m.length>0&&(m+=`
`)):(p=[Du(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(mr).join(`
`),m=[Du(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==_n?"#define TONE_MAPPING":"",t.toneMapping!==_n?Ze.tonemapping_pars_fragment:"",t.toneMapping!==_n?jg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ze.colorspace_pars_fragment,$g("linearToOutputTexel",t.outputColorSpace),Qg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(mr).join(`
`)),a=gc(a),a=Iu(a,t),a=Pu(a,t),o=gc(o),o=Iu(o,t),o=Pu(o,t),a=Lu(a),o=Lu(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,p=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===Zl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Zl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let E=M+p+a,y=M+m+o,b=Au(i,i.VERTEX_SHADER,E),w=Au(i,i.FRAGMENT_SHADER,y);i.attachShader(x,b),i.attachShader(x,w),t.index0AttributeName!==void 0?i.bindAttribLocation(x,0,t.index0AttributeName):t.hasPositionAttribute===!0&&i.bindAttribLocation(x,0,"position"),i.linkProgram(x);function A(I){if(s.debug.checkShaderErrors){let U=i.getProgramInfoLog(x)||"",L=i.getShaderInfoLog(b)||"",P=i.getShaderInfoLog(w)||"",F=U.trim(),O=L.trim(),G=P.trim(),Q=!0,k=!0;if(i.getProgramParameter(x,i.LINK_STATUS)===!1)if(Q=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,x,b,w);else{let Z=Ru(i,b,"vertex"),j=Ru(i,w,"fragment");Fe("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(x,i.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+F+`
`+Z+`
`+j)}else F!==""?Oe("WebGLProgram: Program Info Log:",F):(O===""||G==="")&&(k=!1);k&&(I.diagnostics={runnable:Q,programLog:F,vertexShader:{log:O,prefix:p},fragmentShader:{log:G,prefix:m}})}i.deleteShader(b),i.deleteShader(w),v=new us(i,x),T=nx(i,x)}let v;this.getUniforms=function(){return v===void 0&&A(this),v};let T;this.getAttributes=function(){return T===void 0&&A(this),T};let R=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return R===!1&&(R=i.getProgramParameter(x,qg)),R},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Yg++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=b,this.fragmentShader=w,this}var _x=0,xc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let i=this._getShaderCacheForMaterial(e);return i.has(t)===!1&&(i.add(t),t.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new _c(e),t.set(e,n)),n}},_c=class{constructor(e){this.id=_x++,this.code=e,this.usedTimes=0}};function vx(s){return s===hi||s===ur||s===fr}function yx(s,e,t,n,i,r){let a=new $i,o=new xc,l=new Set,c=[],u=new Map,h=n.logarithmicDepthBuffer,f=n.precision,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(v){return l.add(v),v===0?"uv":`uv${v}`}function x(v,T,R,I,U,L){let P=I.fog,F=U.geometry,O=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?I.environment:null,G=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,Q=e.get(v.envMap||O,G),k=Q&&Q.mapping===rr?Q.image.height:null,Z=d[v.type];v.precision!==null&&(f=n.getMaxPrecision(v.precision),f!==v.precision&&Oe("WebGLProgram.getParameters:",v.precision,"not supported, using",f,"instead."));let j=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,Ee=j!==void 0?j.length:0,ye=0;F.morphAttributes.position!==void 0&&(ye=1),F.morphAttributes.normal!==void 0&&(ye=2),F.morphAttributes.color!==void 0&&(ye=3);let je,qe,Qe,Y;if(Z){let pt=Dn[Z];je=pt.vertexShader,qe=pt.fragmentShader}else{je=v.vertexShader,qe=v.fragmentShader;let pt=o.getVertexShaderStage(v),rt=o.getFragmentShaderStage(v);o.update(v,pt,rt),Qe=pt.id,Y=rt.id}let te=s.getRenderTarget(),xe=s.state.buffers.depth.getReversed(),ze=U.isInstancedMesh===!0,be=U.isBatchedMesh===!0,Ve=!!v.map,lt=!!v.matcap,ne=!!Q,se=!!v.aoMap,re=!!v.lightMap,ae=!!v.bumpMap&&v.wireframe===!1,he=!!v.normalMap,Ne=!!v.displacementMap,De=!!v.emissiveMap,Ge=!!v.metalnessMap,He=!!v.roughnessMap,N=v.anisotropy>0,st=v.clearcoat>0,$e=v.dispersion>0,C=v.retroreflectivity>0,_=v.iridescence>0,V=v.sheen>0,X=v.transmission>0,J=N&&!!v.anisotropyMap,le=st&&!!v.clearcoatMap,ce=st&&!!v.clearcoatNormalMap,$=st&&!!v.clearcoatRoughnessMap,ee=_&&!!v.iridescenceMap,ue=_&&!!v.iridescenceThicknessMap,Ie=V&&!!v.sheenColorMap,me=V&&!!v.sheenRoughnessMap,fe=!!v.specularMap,Pe=!!v.specularColorMap,Ue=!!v.specularIntensityMap,Xe=X&&!!v.transmissionMap,z=X&&!!v.thicknessMap,de=!!v.gradientMap,K=!!v.alphaMap,pe=v.alphaTest>0,Me=!!v.alphaHash,ie=!!v.extensions,Le=_n;v.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(Le=s.toneMapping);let Ce={shaderID:Z,shaderType:v.type,shaderName:v.name,vertexShader:je,fragmentShader:qe,defines:v.defines,customVertexShaderID:Qe,customFragmentShaderID:Y,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:f,batching:be,batchingColor:be&&U._colorsTexture!==null,instancing:ze,instancingColor:ze&&U.instanceColor!==null,instancingMorph:ze&&U.morphTexture!==null,outputColorSpace:te===null?s.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:et.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:Ve,matcap:lt,envMap:ne,envMapMode:ne&&Q.mapping,envMapCubeUVHeight:k,aoMap:se,lightMap:re,bumpMap:ae,normalMap:he,displacementMap:Ne,emissiveMap:De,normalMapObjectSpace:he&&v.normalMapType===$h,normalMapTangentSpace:he&&v.normalMapType===vo,packedNormalMap:he&&v.normalMapType===vo&&vx(v.normalMap.format),metalnessMap:Ge,roughnessMap:He,anisotropy:N,anisotropyMap:J,clearcoat:st,clearcoatMap:le,clearcoatNormalMap:ce,clearcoatRoughnessMap:$,dispersion:$e,retroreflection:C,iridescence:_,iridescenceMap:ee,iridescenceThicknessMap:ue,sheen:V,sheenColorMap:Ie,sheenRoughnessMap:me,specularMap:fe,specularColorMap:Pe,specularIntensityMap:Ue,transmission:X,transmissionMap:Xe,thicknessMap:z,gradientMap:de,opaque:v.transparent===!1&&v.blending===rs&&v.alphaToCoverage===!1,alphaMap:K,alphaTest:pe,alphaHash:Me,combine:v.combine,mapUv:Ve&&g(v.map.channel),aoMapUv:se&&g(v.aoMap.channel),lightMapUv:re&&g(v.lightMap.channel),bumpMapUv:ae&&g(v.bumpMap.channel),normalMapUv:he&&g(v.normalMap.channel),displacementMapUv:Ne&&g(v.displacementMap.channel),emissiveMapUv:De&&g(v.emissiveMap.channel),metalnessMapUv:Ge&&g(v.metalnessMap.channel),roughnessMapUv:He&&g(v.roughnessMap.channel),anisotropyMapUv:J&&g(v.anisotropyMap.channel),clearcoatMapUv:le&&g(v.clearcoatMap.channel),clearcoatNormalMapUv:ce&&g(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:$&&g(v.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&g(v.iridescenceMap.channel),iridescenceThicknessMapUv:ue&&g(v.iridescenceThicknessMap.channel),sheenColorMapUv:Ie&&g(v.sheenColorMap.channel),sheenRoughnessMapUv:me&&g(v.sheenRoughnessMap.channel),specularMapUv:fe&&g(v.specularMap.channel),specularColorMapUv:Pe&&g(v.specularColorMap.channel),specularIntensityMapUv:Ue&&g(v.specularIntensityMap.channel),transmissionMapUv:Xe&&g(v.transmissionMap.channel),thicknessMapUv:z&&g(v.thicknessMap.channel),alphaMapUv:K&&g(v.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(he||N),vertexNormals:!!F.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!F.attributes.uv&&(Ve||K),fog:!!P,useFog:v.fog===!0,fogExp2:!!P&&P.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||F.attributes.normal===void 0&&he===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:xe,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:Ee,morphTextureStride:ye,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:L.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:v.dithering,shadowMapEnabled:s.shadowMap.enabled&&R.length>0,shadowMapType:s.shadowMap.type,toneMapping:Le,decodeVideoTexture:Ve&&v.map.isVideoTexture===!0&&et.getTransfer(v.map.colorSpace)===ot,decodeVideoTextureEmissive:De&&v.emissiveMap.isVideoTexture===!0&&et.getTransfer(v.emissiveMap.colorSpace)===ot,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===ln,flipSided:v.side===Xt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:ie&&v.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ie&&v.extensions.multiDraw===!0||be)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Ce.vertexUv1s=l.has(1),Ce.vertexUv2s=l.has(2),Ce.vertexUv3s=l.has(3),l.clear(),Ce}function p(v){let T=[];if(v.shaderID?T.push(v.shaderID):(T.push(v.customVertexShaderID),T.push(v.customFragmentShaderID)),v.defines!==void 0)for(let R in v.defines)T.push(R),T.push(v.defines[R]);return v.isRawShaderMaterial===!1&&(m(T,v),M(T,v),T.push(s.outputColorSpace)),T.push(v.customProgramCacheKey),T.join()}function m(v,T){v.push(T.precision),v.push(T.outputColorSpace),v.push(T.envMapMode),v.push(T.envMapCubeUVHeight),v.push(T.mapUv),v.push(T.alphaMapUv),v.push(T.lightMapUv),v.push(T.aoMapUv),v.push(T.bumpMapUv),v.push(T.normalMapUv),v.push(T.displacementMapUv),v.push(T.emissiveMapUv),v.push(T.metalnessMapUv),v.push(T.roughnessMapUv),v.push(T.anisotropyMapUv),v.push(T.clearcoatMapUv),v.push(T.clearcoatNormalMapUv),v.push(T.clearcoatRoughnessMapUv),v.push(T.iridescenceMapUv),v.push(T.iridescenceThicknessMapUv),v.push(T.sheenColorMapUv),v.push(T.sheenRoughnessMapUv),v.push(T.specularMapUv),v.push(T.specularColorMapUv),v.push(T.specularIntensityMapUv),v.push(T.transmissionMapUv),v.push(T.thicknessMapUv),v.push(T.combine),v.push(T.fogExp2),v.push(T.sizeAttenuation),v.push(T.morphTargetsCount),v.push(T.morphAttributeCount),v.push(T.numSunLights),v.push(T.numDirLights),v.push(T.numPointLights),v.push(T.numSpotLights),v.push(T.numSpotLightMaps),v.push(T.numHemiLights),v.push(T.numRectAreaLights),v.push(T.numSunLightShadows),v.push(T.numDirLightShadows),v.push(T.numPointLightShadows),v.push(T.numSpotLightShadows),v.push(T.numSpotLightShadowsWithMaps),v.push(T.numLightProbes),v.push(T.shadowMapType),v.push(T.toneMapping),v.push(T.numClippingPlanes),v.push(T.numClipIntersection),v.push(T.depthPacking)}function M(v,T){a.disableAll(),T.instancing&&a.enable(0),T.instancingColor&&a.enable(1),T.instancingMorph&&a.enable(2),T.matcap&&a.enable(3),T.envMap&&a.enable(4),T.normalMapObjectSpace&&a.enable(5),T.normalMapTangentSpace&&a.enable(6),T.clearcoat&&a.enable(7),T.iridescence&&a.enable(8),T.alphaTest&&a.enable(9),T.vertexColors&&a.enable(10),T.vertexAlphas&&a.enable(11),T.vertexUv1s&&a.enable(12),T.vertexUv2s&&a.enable(13),T.vertexUv3s&&a.enable(14),T.vertexTangents&&a.enable(15),T.anisotropy&&a.enable(16),T.alphaHash&&a.enable(17),T.batching&&a.enable(18),T.dispersion&&a.enable(19),T.retroreflection&&a.enable(24),T.batchingColor&&a.enable(20),T.gradientMap&&a.enable(21),T.packedNormalMap&&a.enable(22),T.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reversedDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),T.numLightProbeGrids>0&&a.enable(22),T.hasPositionAttribute&&a.enable(23),v.push(a.mask)}function E(v){let T=d[v.type],R;if(T){let I=Dn[T];R=pu.clone(I.uniforms)}else R=v.uniforms;return R}function y(v,T){let R=u.get(T);return R!==void 0?++R.usedTimes:(R=new xx(s,T,v,i),c.push(R),u.set(T,R)),R}function b(v){if(--v.usedTimes===0){let T=c.indexOf(v);c[T]=c[c.length-1],c.pop(),u.delete(v.cacheKey),v.destroy()}}function w(v){o.remove(v)}function A(){o.dispose()}return{getParameters:x,getProgramCacheKey:p,getUniforms:E,acquireProgram:y,releaseProgram:b,releaseShaderCache:w,programs:c,dispose:A}}function Mx(){let s=new WeakMap;function e(a){return s.has(a)}function t(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,l){s.get(a)[o]=l}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function bx(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.materialVariant!==e.materialVariant?s.materialVariant-e.materialVariant:s.z!==e.z?s.z-e.z:s.id-e.id}function Nu(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function Uu(){let s=[],e=0,t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function a(f){let d=0;return f.isInstancedMesh&&(d+=2),f.isSkinnedMesh&&(d+=1),d}function o(f,d,g,x,p,m){let M=s[e];return M===void 0?(M={id:f.id,object:f,geometry:d,material:g,materialVariant:a(f),groupOrder:x,renderOrder:f.renderOrder,z:p,group:m},s[e]=M):(M.id=f.id,M.object=f,M.geometry=d,M.material=g,M.materialVariant=a(f),M.groupOrder=x,M.renderOrder=f.renderOrder,M.z=p,M.group=m),e++,M}function l(f,d,g,x,p,m,M){M.reversedDepth===!0&&(p=-p);let E=o(f,d,g,x,p,m);g.transmission>0?n.push(E):g.transparent===!0?i.push(E):t.push(E)}function c(f,d,g,x,p,m){let M=o(f,d,g,x,p,m);g.transmission>0?n.unshift(M):g.transparent===!0?i.unshift(M):t.unshift(M)}function u(f,d){t.length>1&&t.sort(f||bx),n.length>1&&n.sort(d||Nu),i.length>1&&i.sort(d||Nu)}function h(){for(let f=e,d=s.length;f<d;f++){let g=s[f];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:l,unshift:c,finish:h,sort:u}}function Sx(){let s=new WeakMap;function e(n,i){let r=s.get(n),a;return r===void 0?(a=new Uu,s.set(n,[a])):i>=r.length?(a=new Uu,r.push(a)):a=r[i],a}function t(){s=new WeakMap}return{get:e,dispose:t}}function wx(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new D,color:new Be};break;case"SpotLight":t={position:new D,direction:new D,color:new Be,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new Be,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new Be,groundColor:new Be};break;case"RectAreaLight":t={color:new Be,position:new D,halfWidth:new D,halfHeight:new D};break}return s[e.id]=t,t}}}function Ex(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new oe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new oe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new oe,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}var Tx=0;function Ax(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function Cx(s){let e=new wx,t=Ex(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new D);let i=new D,r=new tt,a=new tt;function o(c){let u=0,h=0,f=0;for(let U=0;U<9;U++)n.probe[U].set(0,0,0);let d=0,g=0,x=0,p=0,m=0,M=0,E=0,y=0,b=0,w=0,A=0,v=0,T=0,R=0;c.sort(Ax);for(let U=0,L=c.length;U<L;U++){let P=c[U],F=P.color,O=P.intensity,G=P.distance,Q=null;if(P.shadow&&P.shadow.map&&(P.shadow.map.texture.format===hi?Q=P.shadow.map.texture:Q=P.shadow.map.depthTexture||P.shadow.map.texture),P.isAmbientLight)u+=F.r*O,h+=F.g*O,f+=F.b*O;else if(P.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(P.sh.coefficients[k],O);R++}else if(P.isSunLight){let k=e.get(P);if(k.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Z=P.shadow,j=t.get(P);j.shadowIntensity=Z.intensity,j.shadowBias=Z.bias,j.shadowNormalBias=Z.normalBias,j.shadowRadius=Z.radius,j.shadowMapSize.copy(Z.mapSize).multiply(Z.getFrameExtents()),n.sunShadow[g]=j,n.sunShadowMap[g]=Q;let Ee=Z.getViewportCount();for(let ye=0;ye<Ee;ye++)n.sunShadowMatrix[x+ye]=Z.getMatrix(ye),n.sunShadowCascade[x+ye]=Z._cascadeData[ye];x+=Ee,g++}n.sun[d]=k,d++}else if(P.isDirectionalLight){let k=e.get(P);if(k.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Z=P.shadow,j=t.get(P);j.shadowIntensity=Z.intensity,j.shadowBias=Z.bias,j.shadowNormalBias=Z.normalBias,j.shadowRadius=Z.radius,j.shadowMapSize=Z.mapSize,n.directionalShadow[p]=j,n.directionalShadowMap[p]=Q,n.directionalShadowMatrix[p]=P.shadow.matrix,b++}n.directional[p]=k,p++}else if(P.isSpotLight){let k=e.get(P);k.position.setFromMatrixPosition(P.matrixWorld),k.color.copy(F).multiplyScalar(O),k.distance=G,k.coneCos=Math.cos(P.angle),k.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),k.decay=P.decay,n.spot[M]=k;let Z=P.shadow;if(P.map&&(n.spotLightMap[v]=P.map,v++,Z.updateMatrices(P),P.castShadow&&T++),n.spotLightMatrix[M]=Z.matrix,P.castShadow){let j=t.get(P);j.shadowIntensity=Z.intensity,j.shadowBias=Z.bias,j.shadowNormalBias=Z.normalBias,j.shadowRadius=Z.radius,j.shadowMapSize=Z.mapSize,n.spotShadow[M]=j,n.spotShadowMap[M]=Q,A++}M++}else if(P.isRectAreaLight){let k=e.get(P);k.color.copy(F).multiplyScalar(O),k.halfWidth.set(P.width*.5,0,0),k.halfHeight.set(0,P.height*.5,0),n.rectArea[E]=k,E++}else if(P.isPointLight){let k=e.get(P);if(k.color.copy(P.color).multiplyScalar(P.intensity),k.distance=P.distance,k.decay=P.decay,P.castShadow){let Z=P.shadow,j=t.get(P);j.shadowIntensity=Z.intensity,j.shadowBias=Z.bias,j.shadowNormalBias=Z.normalBias,j.shadowRadius=Z.radius,j.shadowMapSize=Z.mapSize,j.shadowCameraNear=Z.camera.near,j.shadowCameraFar=Z.camera.far,n.pointShadow[m]=j,n.pointShadowMap[m]=Q,n.pointShadowMatrix[m]=P.shadow.matrix,w++}n.point[m]=k,m++}else if(P.isHemisphereLight){let k=e.get(P);k.skyColor.copy(P.color).multiplyScalar(O),k.groundColor.copy(P.groundColor).multiplyScalar(O),n.hemi[y]=k,y++}}E>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ge.LTC_FLOAT_1,n.rectAreaLTC2=ge.LTC_FLOAT_2):(n.rectAreaLTC1=ge.LTC_HALF_1,n.rectAreaLTC2=ge.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=f;let I=n.hash;(I.sunLength!==d||I.directionalLength!==p||I.pointLength!==m||I.spotLength!==M||I.rectAreaLength!==E||I.hemiLength!==y||I.numSunShadows!==g||I.numDirectionalShadows!==b||I.numPointShadows!==w||I.numSpotShadows!==A||I.numSpotMaps!==v||I.numLightProbes!==R)&&(n.sun.length=d,n.directional.length=p,n.spot.length=M,n.rectArea.length=E,n.point.length=m,n.hemi.length=y,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=x,n.sunShadowCascade.length=x,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.directionalShadowMatrix.length=b,n.pointShadow.length=w,n.pointShadowMap.length=w,n.pointShadowMatrix.length=w,n.spotShadow.length=A,n.spotShadowMap.length=A,n.spotLightMatrix.length=A+v-T,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=R,I.sunLength=d,I.directionalLength=p,I.pointLength=m,I.spotLength=M,I.rectAreaLength=E,I.hemiLength=y,I.numSunShadows=g,I.numDirectionalShadows=b,I.numPointShadows=w,I.numSpotShadows=A,I.numSpotMaps=v,I.numLightProbes=R,n.version=Tx++)}function l(c,u){let h=0,f=0,d=0,g=0,x=0,p=0,m=u.matrixWorldInverse;for(let M=0,E=c.length;M<E;M++){let y=c[M];if(y.isSunLight){let b=n.sun[h];b.direction.setFromMatrixPosition(y.matrixWorld),b.direction.transformDirection(m),h++}else if(y.isDirectionalLight){let b=n.directional[f];b.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),b.direction.sub(i),b.direction.transformDirection(m),f++}else if(y.isSpotLight){let b=n.spot[g];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(m),b.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),b.direction.sub(i),b.direction.transformDirection(m),g++}else if(y.isRectAreaLight){let b=n.rectArea[x];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(m),a.identity(),r.copy(y.matrixWorld),r.premultiply(m),a.extractRotation(r),b.halfWidth.set(y.width*.5,0,0),b.halfHeight.set(0,y.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),x++}else if(y.isPointLight){let b=n.point[d];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(m),d++}else if(y.isHemisphereLight){let b=n.hemi[p];b.direction.setFromMatrixPosition(y.matrixWorld),b.direction.transformDirection(m),p++}}}return{setup:o,setupView:l,state:n}}function Fu(s){let e=new Cx(s),t=[],n=[],i=[];function r(f){h.camera=f,t.length=0,n.length=0,i.length=0}function a(f){t.push(f)}function o(f){n.push(f)}function l(f){i.push(f)}function c(){e.setup(t)}function u(f){e.setupView(t,f)}let h={lightsArray:t,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:c,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function Rx(s){let e=new WeakMap;function t(i,r=0){let a=e.get(i),o;return a===void 0?(o=new Fu(s),e.set(i,[o])):r>=a.length?(o=new Fu(s),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var Ix=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Px=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Lx=[new D(1,0,0),new D(-1,0,0),new D(0,1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1)],Dx=[new D(0,-1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1),new D(0,-1,0),new D(0,-1,0)],Ou=new tt,pr=new D,uc=new D;function Nx(s,e,t){let n=new Qi,i=new oe,r=new oe,a=new vt,o=new ma,l=new ga,c={},u=t.maxTextureSize,h={[oi]:Xt,[Xt]:oi,[ln]:ln},f=new sn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new oe},radius:{value:4}},vertexShader:Ix,fragmentShader:Px}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let g=new Et;g.setAttribute("position",new Ut(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new We(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=bi;let m=this.type;this.render=function(w,A,v){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||w.length===0)return;this.type===Ah&&(Oe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=bi);let T=s.getRenderTarget(),R=s.getActiveCubeFace(),I=s.getActiveMipmapLevel(),U=s.state;U.setBlending(In),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let L=m!==this.type;L&&A.traverse(function(P){P.material&&(Array.isArray(P.material)?P.material.forEach(F=>F.needsUpdate=!0):P.material.needsUpdate=!0)});for(let P=0,F=w.length;P<F;P++){let O=w[P],G=O.shadow;if(G===void 0){Oe("WebGLShadowMap:",O,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;i.copy(G.mapSize);let Q=G.getFrameExtents();i.multiply(Q),r.copy(G.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/Q.x),i.x=r.x*Q.x,G.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/Q.y),i.y=r.y*Q.y,G.mapSize.y=r.y));let k=s.state.buffers.depth.getReversed();if(G.camera._reversedDepth=k,G.map===null||L===!0){if(G.map!==null&&(G.map.depthTexture!==null&&(G.map.depthTexture.dispose(),G.map.depthTexture=null),G.map.dispose()),this.type===ss){if(O.isPointLight){Oe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}G.map=new $t(i.x,i.y,{format:hi,type:yn,minFilter:Rt,magFilter:Rt,generateMipmaps:!1}),G.map.texture.name=O.name+".shadowMap",G.map.depthTexture=new ni(i.x,i.y,cn),G.map.depthTexture.name=O.name+".shadowMapDepth",G.map.depthTexture.format=Tn,G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=Dt,G.map.depthTexture.magFilter=Dt}else O.isPointLight?(G.map=new Eo(i.x),G.map.depthTexture=new oa(i.x,vn)):(G.map=new $t(i.x,i.y),G.map.depthTexture=new ni(i.x,i.y,vn)),G.map.depthTexture.name=O.name+".shadowMap",G.map.depthTexture.format=Tn,this.type===bi?(G.map.depthTexture.compareFunction=k?Mo:yo,G.map.depthTexture.minFilter=Rt,G.map.depthTexture.magFilter=Rt):(G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=Dt,G.map.depthTexture.magFilter=Dt);G.camera.updateProjectionMatrix()}G.map.isWebGLCubeRenderTarget!==!0&&(G.map.width!==i.x||G.map.height!==i.y)&&G.map.setSize(i.x,i.y);let Z=G.map.isWebGLCubeRenderTarget?6:G.getViewportCount();O.isPointLight!==!0&&G.updateMatrices(O,v);for(let j=0;j<Z;j++){let Ee=G.getCamera(j);if(O.isPointLight){let ye=G.camera,je=G.matrix,qe=O.distance||ye.far;qe!==ye.far&&(ye.far=qe,ye.updateProjectionMatrix()),pr.setFromMatrixPosition(O.matrixWorld),ye.position.copy(pr),uc.copy(ye.position),uc.add(Lx[j]),ye.up.copy(Dx[j]),ye.lookAt(uc),ye.updateMatrixWorld(),je.makeTranslation(-pr.x,-pr.y,-pr.z),Ou.multiplyMatrices(ye.projectionMatrix,ye.matrixWorldInverse),G._frustum.setFromProjectionMatrix(Ou,ye.coordinateSystem,ye.reversedDepth)}if(G.map.isWebGLCubeRenderTarget)s.setRenderTarget(G.map,j),s.clear();else{j===0&&(s.setRenderTarget(G.map),s.clear());let ye=G.getViewport(j);a.set(r.x*ye.x,r.y*ye.y,r.x*ye.z,r.y*ye.w),U.viewport(a)}n=G.getFrustum(j),y(A,v,Ee,O,this.type)}G.isPointLightShadow!==!0&&this.type===ss&&M(G,v),G.needsUpdate=!1}m=this.type,p.needsUpdate=!1,s.setRenderTarget(T,R,I)};function M(w,A){let v=e.update(x);f.defines.VSM_SAMPLES!==w.blurSamples&&(f.defines.VSM_SAMPLES=w.blurSamples,d.defines.VSM_SAMPLES=w.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),w.mapPass===null?w.mapPass=new $t(i.x,i.y,{format:hi,type:yn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),f.uniforms.shadow_pass.value=w.map.depthTexture,f.uniforms.resolution.value.set(w.map.width,w.map.height),f.uniforms.radius.value=w.radius,s.setRenderTarget(w.mapPass),s.clear(),s.renderBufferDirect(A,null,v,f,x,null),d.uniforms.shadow_pass.value=w.mapPass.texture,d.uniforms.resolution.value.set(w.map.width,w.map.height),d.uniforms.radius.value=w.radius,s.setRenderTarget(w.map),s.clear(),s.renderBufferDirect(A,null,v,d,x,null)}function E(w,A,v,T){let R=null,I=v.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(I!==void 0)R=I;else if(R=v.isPointLight===!0?l:o,s.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let U=R.uuid,L=A.uuid,P=c[U];P===void 0&&(P={},c[U]=P);let F=P[L];F===void 0&&(F=R.clone(),P[L]=F,A.addEventListener("dispose",b)),R=F}if(R.visible=A.visible,R.wireframe=A.wireframe,T===ss?R.side=A.shadowSide!==null?A.shadowSide:A.side:R.side=A.shadowSide!==null?A.shadowSide:h[A.side],R.alphaMap=A.alphaMap,R.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,R.map=A.map,R.clipShadows=A.clipShadows,R.clippingPlanes=A.clippingPlanes,R.clipIntersection=A.clipIntersection,R.displacementMap=A.displacementMap,R.displacementScale=A.displacementScale,R.displacementBias=A.displacementBias,R.wireframeLinewidth=A.wireframeLinewidth,R.linewidth=A.linewidth,v.isPointLight===!0&&R.isMeshDistanceMaterial===!0){let U=s.properties.get(R);U.light=v}return R}function y(w,A,v,T,R){if(w.visible===!1)return;if(w.layers.test(A.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&R===ss)&&(!w.frustumCulled||w.intersectsFrustum(n))){w.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,w.matrixWorld);let L=e.update(w),P=w.material;if(Array.isArray(P)){let F=L.groups;for(let O=0,G=F.length;O<G;O++){let Q=F[O],k=P[Q.materialIndex];if(k&&k.visible){let Z=E(w,k,T,R);w.onBeforeShadow(s,w,A,v,L,Z,Q),s.renderBufferDirect(v,null,L,Z,w,Q),w.onAfterShadow(s,w,A,v,L,Z,Q)}}}else if(P.visible){let F=E(w,P,T,R);w.onBeforeShadow(s,w,A,v,L,F,null),s.renderBufferDirect(v,null,L,F,w,null),w.onAfterShadow(s,w,A,v,L,F,null)}}let U=w.children;for(let L=0,P=U.length;L<P;L++)y(U[L],A,v,T,R)}function b(w){w.target.removeEventListener("dispose",b);for(let v in c){let T=c[v],R=w.target.uuid;R in T&&(T[R].dispose(),delete T[R])}}}function Ux(s,e){function t(){let z=!1,de=new vt,K=null,pe=new vt(0,0,0,0);return{setMask:function(Me){K!==Me&&!z&&(s.colorMask(Me,Me,Me,Me),K=Me)},setLocked:function(Me){z=Me},setClear:function(Me,ie,Le,Ce,pt){pt===!0&&(Me*=Ce,ie*=Ce,Le*=Ce),de.set(Me,ie,Le,Ce),pe.equals(de)===!1&&(s.clearColor(Me,ie,Le,Ce),pe.copy(de))},reset:function(){z=!1,K=null,pe.set(-1,0,0,0)}}}function n(){let z=!1,de=!1,K=null,pe=null,Me=null;return{setReversed:function(ie){if(de!==ie){let Le=e.get("EXT_clip_control");ie?Le.clipControlEXT(Le.LOWER_LEFT_EXT,Le.ZERO_TO_ONE_EXT):Le.clipControlEXT(Le.LOWER_LEFT_EXT,Le.NEGATIVE_ONE_TO_ONE_EXT),de=ie;let Ce=Me;Me=null,this.setClear(Ce)}},getReversed:function(){return de},setTest:function(ie){ie?te(s.DEPTH_TEST):xe(s.DEPTH_TEST)},setMask:function(ie){K!==ie&&!z&&(s.depthMask(ie),K=ie)},setFunc:function(ie){if(de&&(ie=lu[ie]),pe!==ie){switch(ie){case Zr:s.depthFunc(s.NEVER);break;case Jr:s.depthFunc(s.ALWAYS);break;case $r:s.depthFunc(s.LESS);break;case qi:s.depthFunc(s.LEQUAL);break;case Kr:s.depthFunc(s.EQUAL);break;case jr:s.depthFunc(s.GEQUAL);break;case Qr:s.depthFunc(s.GREATER);break;case ea:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}pe=ie}},setLocked:function(ie){z=ie},setClear:function(ie){Me!==ie&&(Me=ie,de&&(ie=1-ie),s.clearDepth(ie))},reset:function(){z=!1,K=null,pe=null,Me=null,de=!1}}}function i(){let z=!1,de=null,K=null,pe=null,Me=null,ie=null,Le=null,Ce=null,pt=null;return{setTest:function(rt){z||(rt?te(s.STENCIL_TEST):xe(s.STENCIL_TEST))},setMask:function(rt){de!==rt&&!z&&(s.stencilMask(rt),de=rt)},setFunc:function(rt,un,bn){(K!==rt||pe!==un||Me!==bn)&&(s.stencilFunc(rt,un,bn),K=rt,pe=un,Me=bn)},setOp:function(rt,un,bn){(ie!==rt||Le!==un||Ce!==bn)&&(s.stencilOp(rt,un,bn),ie=rt,Le=un,Ce=bn)},setLocked:function(rt){z=rt},setClear:function(rt){pt!==rt&&(s.clearStencil(rt),pt=rt)},reset:function(){z=!1,de=null,K=null,pe=null,Me=null,ie=null,Le=null,Ce=null,pt=null}}}let r=new t,a=new n,o=new i,l=new WeakMap,c=new WeakMap,u={},h={},f={},d=new WeakMap,g=[],x=null,p=!1,m=null,M=null,E=null,y=null,b=null,w=null,A=null,v=new Be(0,0,0),T=0,R=!1,I=null,U=null,L=null,P=null,F=null,O=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),G=!1,Q=0,k=s.getParameter(s.VERSION);k.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(k)[1]),G=Q>=1):k.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(k)[1]),G=Q>=2);let Z=null,j={},Ee=s.getParameter(s.SCISSOR_BOX),ye=s.getParameter(s.VIEWPORT),je=new vt().fromArray(Ee),qe=new vt().fromArray(ye);function Qe(z,de,K,pe){let Me=new Uint8Array(4),ie=s.createTexture();s.bindTexture(z,ie),s.texParameteri(z,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(z,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Le=0;Le<K;Le++)z===s.TEXTURE_3D||z===s.TEXTURE_2D_ARRAY?s.texImage3D(de,0,s.RGBA,1,1,pe,0,s.RGBA,s.UNSIGNED_BYTE,Me):s.texImage2D(de+Le,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,Me);return ie}let Y={};Y[s.TEXTURE_2D]=Qe(s.TEXTURE_2D,s.TEXTURE_2D,1),Y[s.TEXTURE_CUBE_MAP]=Qe(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[s.TEXTURE_2D_ARRAY]=Qe(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),Y[s.TEXTURE_3D]=Qe(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),te(s.DEPTH_TEST),a.setFunc(qi),ae(!1),he(Cl),te(s.CULL_FACE),se(In);function te(z){u[z]!==!0&&(s.enable(z),u[z]=!0)}function xe(z){u[z]!==!1&&(s.disable(z),u[z]=!1)}function ze(z,de){return f[z]!==de?(s.bindFramebuffer(z,de),f[z]=de,z===s.DRAW_FRAMEBUFFER&&(f[s.FRAMEBUFFER]=de),z===s.FRAMEBUFFER&&(f[s.DRAW_FRAMEBUFFER]=de),!0):!1}function be(z,de){let K=g,pe=!1;if(z){K=d.get(de),K===void 0&&(K=[],d.set(de,K));let Me=z.textures;if(K.length!==Me.length||K[0]!==s.COLOR_ATTACHMENT0){for(let ie=0,Le=Me.length;ie<Le;ie++)K[ie]=s.COLOR_ATTACHMENT0+ie;K.length=Me.length,pe=!0}}else K[0]!==s.BACK&&(K[0]=s.BACK,pe=!0);pe&&s.drawBuffers(K)}function Ve(z){return x!==z?(s.useProgram(z),x=z,!0):!1}let lt={[Si]:s.FUNC_ADD,[Rh]:s.FUNC_SUBTRACT,[Ih]:s.FUNC_REVERSE_SUBTRACT};lt[Ph]=s.MIN,lt[Lh]=s.MAX;let ne={[Dh]:s.ZERO,[Nh]:s.ONE,[Uh]:s.SRC_COLOR,[Ll]:s.SRC_ALPHA,[Gh]:s.SRC_ALPHA_SATURATE,[zh]:s.DST_COLOR,[Oh]:s.DST_ALPHA,[Fh]:s.ONE_MINUS_SRC_COLOR,[Dl]:s.ONE_MINUS_SRC_ALPHA,[Vh]:s.ONE_MINUS_DST_COLOR,[Bh]:s.ONE_MINUS_DST_ALPHA,[kh]:s.CONSTANT_COLOR,[Hh]:s.ONE_MINUS_CONSTANT_COLOR,[Wh]:s.CONSTANT_ALPHA,[Xh]:s.ONE_MINUS_CONSTANT_ALPHA};function se(z,de,K,pe,Me,ie,Le,Ce,pt,rt){if(z===In){p===!0&&(xe(s.BLEND),p=!1);return}if(p===!1&&(te(s.BLEND),p=!0),z!==Ch){if(z!==m||rt!==R){if((M!==Si||b!==Si)&&(s.blendEquation(s.FUNC_ADD),M=Si,b=Si),rt)switch(z){case rs:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Rl:s.blendFunc(s.ONE,s.ONE);break;case Il:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Pl:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:Fe("WebGLState: Invalid blending: ",z);break}else switch(z){case rs:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Rl:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case Il:Fe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Pl:Fe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Fe("WebGLState: Invalid blending: ",z);break}E=null,y=null,w=null,A=null,v.set(0,0,0),T=0,m=z,R=rt}return}Me=Me||de,ie=ie||K,Le=Le||pe,(de!==M||Me!==b)&&(s.blendEquationSeparate(lt[de],lt[Me]),M=de,b=Me),(K!==E||pe!==y||ie!==w||Le!==A)&&(s.blendFuncSeparate(ne[K],ne[pe],ne[ie],ne[Le]),E=K,y=pe,w=ie,A=Le),(Ce.equals(v)===!1||pt!==T)&&(s.blendColor(Ce.r,Ce.g,Ce.b,pt),v.copy(Ce),T=pt),m=z,R=!1}function re(z,de){z.side===ln?xe(s.CULL_FACE):te(s.CULL_FACE);let K=z.side===Xt;de&&(K=!K),ae(K),z.blending===rs&&z.transparent===!1?se(In):se(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),a.setFunc(z.depthFunc),a.setTest(z.depthTest),a.setMask(z.depthWrite),r.setMask(z.colorWrite);let pe=z.stencilWrite;o.setTest(pe),pe&&(o.setMask(z.stencilWriteMask),o.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),o.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),De(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?te(s.SAMPLE_ALPHA_TO_COVERAGE):xe(s.SAMPLE_ALPHA_TO_COVERAGE)}function ae(z){I!==z&&(z?s.frontFace(s.CW):s.frontFace(s.CCW),I=z)}function he(z){z!==Eh?(te(s.CULL_FACE),z!==U&&(z===Cl?s.cullFace(s.BACK):z===Th?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):xe(s.CULL_FACE),U=z}function Ne(z){z!==L&&(G&&s.lineWidth(z),L=z)}function De(z,de,K){z?(te(s.POLYGON_OFFSET_FILL),(P!==de||F!==K)&&(P=de,F=K,a.getReversed()&&(de=-de),s.polygonOffset(de,K))):xe(s.POLYGON_OFFSET_FILL)}function Ge(z){z?te(s.SCISSOR_TEST):xe(s.SCISSOR_TEST)}function He(z){z===void 0&&(z=s.TEXTURE0+O-1),Z!==z&&(s.activeTexture(z),Z=z)}function N(z,de,K){K===void 0&&(Z===null?K=s.TEXTURE0+O-1:K=Z);let pe=j[K];pe===void 0&&(pe={type:void 0,texture:void 0},j[K]=pe),(pe.type!==z||pe.texture!==de)&&(Z!==K&&(s.activeTexture(K),Z=K),s.bindTexture(z,de||Y[z]),pe.type=z,pe.texture=de)}function st(){let z=j[Z];z!==void 0&&z.type!==void 0&&(s.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function $e(){try{s.compressedTexImage2D(...arguments)}catch(z){Fe("WebGLState:",z)}}function C(){try{s.compressedTexImage3D(...arguments)}catch(z){Fe("WebGLState:",z)}}function _(){try{s.texSubImage2D(...arguments)}catch(z){Fe("WebGLState:",z)}}function V(){try{s.texSubImage3D(...arguments)}catch(z){Fe("WebGLState:",z)}}function X(){try{s.compressedTexSubImage2D(...arguments)}catch(z){Fe("WebGLState:",z)}}function J(){try{s.compressedTexSubImage3D(...arguments)}catch(z){Fe("WebGLState:",z)}}function le(){try{s.texStorage2D(...arguments)}catch(z){Fe("WebGLState:",z)}}function ce(){try{s.texStorage3D(...arguments)}catch(z){Fe("WebGLState:",z)}}function $(){try{s.texImage2D(...arguments)}catch(z){Fe("WebGLState:",z)}}function ee(){try{s.texImage3D(...arguments)}catch(z){Fe("WebGLState:",z)}}function ue(z){return h[z]!==void 0?h[z]:s.getParameter(z)}function Ie(z,de){h[z]!==de&&(s.pixelStorei(z,de),h[z]=de)}function me(z){je.equals(z)===!1&&(s.scissor(z.x,z.y,z.z,z.w),je.copy(z))}function fe(z){qe.equals(z)===!1&&(s.viewport(z.x,z.y,z.z,z.w),qe.copy(z))}function Pe(z,de){let K=c.get(de);K===void 0&&(K=new WeakMap,c.set(de,K));let pe=K.get(z);pe===void 0&&(pe=s.getUniformBlockIndex(de,z.name),K.set(z,pe))}function Ue(z,de){let pe=c.get(de).get(z);l.get(de)!==pe&&(s.uniformBlockBinding(de,pe,z.__bindingPointIndex),l.set(de,pe))}function Xe(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),u={},h={},Z=null,j={},f={},d=new WeakMap,g=[],x=null,p=!1,m=null,M=null,E=null,y=null,b=null,w=null,A=null,v=new Be(0,0,0),T=0,R=!1,I=null,U=null,L=null,P=null,F=null,je.set(0,0,s.canvas.width,s.canvas.height),qe.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:te,disable:xe,bindFramebuffer:ze,drawBuffers:be,useProgram:Ve,setBlending:se,setMaterial:re,setFlipSided:ae,setCullFace:he,setLineWidth:Ne,setPolygonOffset:De,setScissorTest:Ge,activeTexture:He,bindTexture:N,unbindTexture:st,compressedTexImage2D:$e,compressedTexImage3D:C,texImage2D:$,texImage3D:ee,pixelStorei:Ie,getParameter:ue,updateUBOMapping:Pe,uniformBlockBinding:Ue,texStorage2D:le,texStorage3D:ce,texSubImage2D:_,texSubImage3D:V,compressedTexSubImage2D:X,compressedTexSubImage3D:J,scissor:me,viewport:fe,reset:Xe}}function Fx(s,e,t,n,i,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new oe,u=new WeakMap,h=new Set,f,d=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(C,_){return g?new OffscreenCanvas(C,_):Ls("canvas")}function p(C,_,V){let X=1,J=$e(C);if((J.width>V||J.height>V)&&(X=V/Math.max(J.width,J.height)),X<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let le=Math.floor(X*J.width),ce=Math.floor(X*J.height);f===void 0&&(f=x(le,ce));let $=_?x(le,ce):f;return $.width=le,$.height=ce,$.getContext("2d").drawImage(C,0,0,le,ce),Oe("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+le+"x"+ce+")."),$}else return"data"in C&&Oe("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),C;return C}function m(C){return C.generateMipmaps}function M(C){s.generateMipmap(C)}function E(C){return C.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?s.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function y(C,_,V,X,J,le=!1){if(C!==null){if(s[C]!==void 0)return s[C];Oe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let ce;X&&(ce=e.get("EXT_texture_norm16"),ce||Oe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=_;if(_===s.RED&&(V===s.FLOAT&&($=s.R32F),V===s.HALF_FLOAT&&($=s.R16F),V===s.UNSIGNED_BYTE&&($=s.R8),V===s.UNSIGNED_SHORT&&ce&&($=ce.R16_EXT),V===s.SHORT&&ce&&($=ce.R16_SNORM_EXT)),_===s.RED_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.R8UI),V===s.UNSIGNED_SHORT&&($=s.R16UI),V===s.UNSIGNED_INT&&($=s.R32UI),V===s.BYTE&&($=s.R8I),V===s.SHORT&&($=s.R16I),V===s.INT&&($=s.R32I)),_===s.RG&&(V===s.FLOAT&&($=s.RG32F),V===s.HALF_FLOAT&&($=s.RG16F),V===s.UNSIGNED_BYTE&&($=s.RG8),V===s.UNSIGNED_SHORT&&ce&&($=ce.RG16_EXT),V===s.SHORT&&ce&&($=ce.RG16_SNORM_EXT)),_===s.RG_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.RG8UI),V===s.UNSIGNED_SHORT&&($=s.RG16UI),V===s.UNSIGNED_INT&&($=s.RG32UI),V===s.BYTE&&($=s.RG8I),V===s.SHORT&&($=s.RG16I),V===s.INT&&($=s.RG32I)),_===s.RGB_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.RGB8UI),V===s.UNSIGNED_SHORT&&($=s.RGB16UI),V===s.UNSIGNED_INT&&($=s.RGB32UI),V===s.BYTE&&($=s.RGB8I),V===s.SHORT&&($=s.RGB16I),V===s.INT&&($=s.RGB32I)),_===s.RGBA_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.RGBA8UI),V===s.UNSIGNED_SHORT&&($=s.RGBA16UI),V===s.UNSIGNED_INT&&($=s.RGBA32UI),V===s.BYTE&&($=s.RGBA8I),V===s.SHORT&&($=s.RGBA16I),V===s.INT&&($=s.RGBA32I)),_===s.RGB&&(V===s.UNSIGNED_SHORT&&ce&&($=ce.RGB16_EXT),V===s.SHORT&&ce&&($=ce.RGB16_SNORM_EXT),V===s.UNSIGNED_INT_5_9_9_9_REV&&($=s.RGB9_E5),V===s.UNSIGNED_INT_10F_11F_11F_REV&&($=s.R11F_G11F_B10F)),_===s.RGBA){let ee=le?Ps:et.getTransfer(J);V===s.FLOAT&&($=s.RGBA32F),V===s.HALF_FLOAT&&($=s.RGBA16F),V===s.UNSIGNED_BYTE&&($=ee===ot?s.SRGB8_ALPHA8:s.RGBA8),V===s.UNSIGNED_SHORT&&ce&&($=ce.RGBA16_EXT),V===s.SHORT&&ce&&($=ce.RGBA16_SNORM_EXT),V===s.UNSIGNED_SHORT_4_4_4_4&&($=s.RGBA4),V===s.UNSIGNED_SHORT_5_5_5_1&&($=s.RGB5_A1)}return($===s.R16F||$===s.R32F||$===s.RG16F||$===s.RG32F||$===s.RGBA16F||$===s.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function b(C,_){let V;return C?_===null||_===vn||_===os?V=s.DEPTH24_STENCIL8:_===cn?V=s.DEPTH32F_STENCIL8:_===as&&(V=s.DEPTH24_STENCIL8,Oe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===vn||_===os?V=s.DEPTH_COMPONENT24:_===cn?V=s.DEPTH_COMPONENT32F:_===as&&(V=s.DEPTH_COMPONENT16),V}function w(C,_){return m(C)===!0||C.isFramebufferTexture&&C.minFilter!==Dt&&C.minFilter!==Rt?Math.log2(Math.max(_.width,_.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?_.mipmaps.length:1}function A(C){let _=C.target;_.removeEventListener("dispose",A),T(_),_.isVideoTexture&&u.delete(_),_.isHTMLTexture&&h.delete(_)}function v(C){let _=C.target;_.removeEventListener("dispose",v),I(_)}function T(C){let _=n.get(C);if(_.__webglInit===void 0)return;let V=C.source,X=d.get(V);if(X){let J=X[_.__cacheKey];J.usedTimes--,J.usedTimes===0&&R(C),Object.keys(X).length===0&&d.delete(V)}n.remove(C)}function R(C){let _=n.get(C);s.deleteTexture(_.__webglTexture);let V=C.source,X=d.get(V);delete X[_.__cacheKey],a.memory.textures--}function I(C){let _=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(_.__webglFramebuffer[X]))for(let J=0;J<_.__webglFramebuffer[X].length;J++)s.deleteFramebuffer(_.__webglFramebuffer[X][J]);else s.deleteFramebuffer(_.__webglFramebuffer[X]);_.__webglDepthbuffer&&s.deleteRenderbuffer(_.__webglDepthbuffer[X])}else{if(Array.isArray(_.__webglFramebuffer))for(let X=0;X<_.__webglFramebuffer.length;X++)s.deleteFramebuffer(_.__webglFramebuffer[X]);else s.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&s.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&s.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let X=0;X<_.__webglColorRenderbuffer.length;X++)_.__webglColorRenderbuffer[X]&&s.deleteRenderbuffer(_.__webglColorRenderbuffer[X]);_.__webglDepthRenderbuffer&&s.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let V=C.textures;for(let X=0,J=V.length;X<J;X++){let le=n.get(V[X]);le.__webglTexture&&(s.deleteTexture(le.__webglTexture),a.memory.textures--),n.remove(V[X])}n.remove(C)}let U=0;function L(){U=0}function P(){return U}function F(C){U=C}function O(){let C=U;return C>=i.maxTextures&&Oe("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+i.maxTextures),U+=1,C}function G(C){let _=[];return _.push(C.wrapS),_.push(C.wrapT),_.push(C.wrapR||0),_.push(C.magFilter),_.push(C.minFilter),_.push(C.anisotropy),_.push(C.internalFormat),_.push(C.format),_.push(C.type),_.push(C.generateMipmaps),_.push(C.premultiplyAlpha),_.push(C.flipY),_.push(C.unpackAlignment),_.push(C.colorSpace),_.join()}function Q(C,_){let V=n.get(C);if(C.isVideoTexture&&N(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&V.__version!==C.version){let X=C.image;if(X===null)Oe("WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)Oe("WebGLRenderer: Texture marked for update but image is incomplete");else{xe(V,C,_);return}}else C.isExternalTexture&&(V.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,V.__webglTexture,s.TEXTURE0+_)}function k(C,_){let V=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&V.__version!==C.version){xe(V,C,_);return}else C.isExternalTexture&&(V.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(s.TEXTURE_2D_ARRAY,V.__webglTexture,s.TEXTURE0+_)}function Z(C,_){let V=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&V.__version!==C.version){xe(V,C,_);return}t.bindTexture(s.TEXTURE_3D,V.__webglTexture,s.TEXTURE0+_)}function j(C,_){let V=n.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&V.__version!==C.version){ze(V,C,_);return}t.bindTexture(s.TEXTURE_CUBE_MAP,V.__webglTexture,s.TEXTURE0+_)}let Ee={[_i]:s.REPEAT,[tn]:s.CLAMP_TO_EDGE,[ta]:s.MIRRORED_REPEAT},ye={[Dt]:s.NEAREST,[Zh]:s.NEAREST_MIPMAP_NEAREST,[ar]:s.NEAREST_MIPMAP_LINEAR,[Rt]:s.LINEAR,[Na]:s.LINEAR_MIPMAP_NEAREST,[Pn]:s.LINEAR_MIPMAP_LINEAR},je={[jh]:s.NEVER,[iu]:s.ALWAYS,[Qh]:s.LESS,[yo]:s.LEQUAL,[eu]:s.EQUAL,[Mo]:s.GEQUAL,[tu]:s.GREATER,[nu]:s.NOTEQUAL};function qe(C,_){if(_.type===cn&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===Rt||_.magFilter===Na||_.magFilter===ar||_.magFilter===Pn||_.minFilter===Rt||_.minFilter===Na||_.minFilter===ar||_.minFilter===Pn)&&Oe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(C,s.TEXTURE_WRAP_S,Ee[_.wrapS]),s.texParameteri(C,s.TEXTURE_WRAP_T,Ee[_.wrapT]),(C===s.TEXTURE_3D||C===s.TEXTURE_2D_ARRAY)&&s.texParameteri(C,s.TEXTURE_WRAP_R,Ee[_.wrapR]),s.texParameteri(C,s.TEXTURE_MAG_FILTER,ye[_.magFilter]),s.texParameteri(C,s.TEXTURE_MIN_FILTER,ye[_.minFilter]),_.compareFunction&&(s.texParameteri(C,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(C,s.TEXTURE_COMPARE_FUNC,je[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Dt||_.minFilter!==ar&&_.minFilter!==Pn||_.type===cn&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");s.texParameterf(C,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,i.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Qe(C,_){let V=!1;C.__webglInit===void 0&&(C.__webglInit=!0,_.addEventListener("dispose",A));let X=_.source,J=d.get(X);J===void 0&&(J={},d.set(X,J));let le=G(_);if(le!==C.__cacheKey){J[le]===void 0&&(J[le]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,V=!0),J[le].usedTimes++;let ce=J[C.__cacheKey];ce!==void 0&&(J[C.__cacheKey].usedTimes--,ce.usedTimes===0&&R(_)),C.__cacheKey=le,C.__webglTexture=J[le].texture}return V}function Y(C,_,V){return Math.floor(Math.floor(C/V)/_)}function te(C,_,V,X){let le=C.updateRanges;if(le.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,_.width,_.height,V,X,_.data);else{le.sort((Ie,me)=>Ie.start-me.start);let ce=0;for(let Ie=1;Ie<le.length;Ie++){let me=le[ce],fe=le[Ie],Pe=me.start+me.count,Ue=Y(fe.start,_.width,4),Xe=Y(me.start,_.width,4);fe.start<=Pe+1&&Ue===Xe&&Y(fe.start+fe.count-1,_.width,4)===Ue?me.count=Math.max(me.count,fe.start+fe.count-me.start):(++ce,le[ce]=fe)}le.length=ce+1;let $=t.getParameter(s.UNPACK_ROW_LENGTH),ee=t.getParameter(s.UNPACK_SKIP_PIXELS),ue=t.getParameter(s.UNPACK_SKIP_ROWS);t.pixelStorei(s.UNPACK_ROW_LENGTH,_.width);for(let Ie=0,me=le.length;Ie<me;Ie++){let fe=le[Ie],Pe=Math.floor(fe.start/4),Ue=Math.ceil(fe.count/4),Xe=Pe%_.width,z=Math.floor(Pe/_.width),de=Ue,K=1;t.pixelStorei(s.UNPACK_SKIP_PIXELS,Xe),t.pixelStorei(s.UNPACK_SKIP_ROWS,z),t.texSubImage2D(s.TEXTURE_2D,0,Xe,z,de,K,V,X,_.data)}C.clearUpdateRanges(),t.pixelStorei(s.UNPACK_ROW_LENGTH,$),t.pixelStorei(s.UNPACK_SKIP_PIXELS,ee),t.pixelStorei(s.UNPACK_SKIP_ROWS,ue)}}function xe(C,_,V){let X=s.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(X=s.TEXTURE_2D_ARRAY),_.isData3DTexture&&(X=s.TEXTURE_3D);let J=Qe(C,_),le=_.source;t.bindTexture(X,C.__webglTexture,s.TEXTURE0+V);let ce=n.get(le);if(le.version!==ce.__version||J===!0){if(t.activeTexture(s.TEXTURE0+V),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let K=et.getPrimaries(et.workingColorSpace),pe=_.colorSpace===Wn?null:et.getPrimaries(_.colorSpace),Me=_.colorSpace===Wn||K===pe?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Me)}t.pixelStorei(s.UNPACK_ALIGNMENT,_.unpackAlignment);let ee=p(_.image,!1,i.maxTextureSize);ee=st(_,ee);let ue=r.convert(_.format,_.colorSpace),Ie=r.convert(_.type),me=y(_.internalFormat,ue,Ie,_.normalized,_.colorSpace,_.isVideoTexture);qe(X,_);let fe,Pe=_.mipmaps,Ue=_.isVideoTexture!==!0,Xe=ce.__version===void 0||J===!0,z=le.dataReady,de=w(_,ee);if(_.isDepthTexture)me=b(_.format===ci,_.type),Xe&&(Ue?t.texStorage2D(s.TEXTURE_2D,1,me,ee.width,ee.height):t.texImage2D(s.TEXTURE_2D,0,me,ee.width,ee.height,0,ue,Ie,null));else if(_.isDataTexture)if(Pe.length>0){Ue&&Xe&&t.texStorage2D(s.TEXTURE_2D,de,me,Pe[0].width,Pe[0].height);for(let K=0,pe=Pe.length;K<pe;K++)fe=Pe[K],Ue?z&&t.texSubImage2D(s.TEXTURE_2D,K,0,0,fe.width,fe.height,ue,Ie,fe.data):t.texImage2D(s.TEXTURE_2D,K,me,fe.width,fe.height,0,ue,Ie,fe.data);_.generateMipmaps=!1}else Ue?(Xe&&t.texStorage2D(s.TEXTURE_2D,de,me,ee.width,ee.height),z&&te(_,ee,ue,Ie)):t.texImage2D(s.TEXTURE_2D,0,me,ee.width,ee.height,0,ue,Ie,ee.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Ue&&Xe&&t.texStorage3D(s.TEXTURE_2D_ARRAY,de,me,Pe[0].width,Pe[0].height,ee.depth);for(let K=0,pe=Pe.length;K<pe;K++)if(fe=Pe[K],_.format!==hn)if(ue!==null)if(Ue){if(z)if(_.layerUpdates.size>0){let Me=ec(fe.width,fe.height,_.format,_.type);for(let ie of _.layerUpdates){let Le=fe.data.subarray(ie*Me/fe.data.BYTES_PER_ELEMENT,(ie+1)*Me/fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,K,0,0,ie,fe.width,fe.height,1,ue,Le)}}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,K,0,0,0,fe.width,fe.height,ee.depth,ue,fe.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,K,me,fe.width,fe.height,ee.depth,0,fe.data,0,0);else Oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ue?z&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,K,0,0,0,fe.width,fe.height,ee.depth,ue,Ie,fe.data):t.texImage3D(s.TEXTURE_2D_ARRAY,K,me,fe.width,fe.height,ee.depth,0,ue,Ie,fe.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{Ue&&Xe&&t.texStorage2D(s.TEXTURE_2D,de,me,Pe[0].width,Pe[0].height);for(let K=0,pe=Pe.length;K<pe;K++)fe=Pe[K],_.format!==hn?ue!==null?Ue?z&&t.compressedTexSubImage2D(s.TEXTURE_2D,K,0,0,fe.width,fe.height,ue,fe.data):t.compressedTexImage2D(s.TEXTURE_2D,K,me,fe.width,fe.height,0,fe.data):Oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ue?z&&t.texSubImage2D(s.TEXTURE_2D,K,0,0,fe.width,fe.height,ue,Ie,fe.data):t.texImage2D(s.TEXTURE_2D,K,me,fe.width,fe.height,0,ue,Ie,fe.data)}else if(_.isDataArrayTexture)if(Ue){if(Xe&&t.texStorage3D(s.TEXTURE_2D_ARRAY,de,me,ee.width,ee.height,ee.depth),z)if(_.layerUpdates.size>0){let K=ec(ee.width,ee.height,_.format,_.type);for(let pe of _.layerUpdates){let Me=ee.data.subarray(pe*K/ee.data.BYTES_PER_ELEMENT,(pe+1)*K/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,pe,ee.width,ee.height,1,ue,Ie,Me)}_.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,ue,Ie,ee.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,me,ee.width,ee.height,ee.depth,0,ue,Ie,ee.data);else if(_.isData3DTexture)Ue?(Xe&&t.texStorage3D(s.TEXTURE_3D,de,me,ee.width,ee.height,ee.depth),z&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,ue,Ie,ee.data)):t.texImage3D(s.TEXTURE_3D,0,me,ee.width,ee.height,ee.depth,0,ue,Ie,ee.data);else if(_.isFramebufferTexture){if(Xe)if(Ue)t.texStorage2D(s.TEXTURE_2D,de,me,ee.width,ee.height);else{let K=ee.width,pe=ee.height;for(let Me=0;Me<de;Me++)t.texImage2D(s.TEXTURE_2D,Me,me,K,pe,0,ue,Ie,null),K>>=1,pe>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in s){let K=s.canvas;if(K.hasAttribute("layoutsubtree")||K.setAttribute("layoutsubtree","true"),ee.parentNode!==K){K.appendChild(ee),h.add(_),K.onpaint=pe=>{let Me=pe.changedElements;for(let ie of h)Me.includes(ie.image)&&(ie.needsUpdate=!0)},K.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,ee);else{let Me=s.RGBA,ie=s.RGBA,Le=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,Me,ie,Le,ee)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(Pe.length>0){if(Ue&&Xe){let K=$e(Pe[0]);t.texStorage2D(s.TEXTURE_2D,de,me,K.width,K.height)}for(let K=0,pe=Pe.length;K<pe;K++)fe=Pe[K],Ue?z&&t.texSubImage2D(s.TEXTURE_2D,K,0,0,ue,Ie,fe):t.texImage2D(s.TEXTURE_2D,K,me,ue,Ie,fe);_.generateMipmaps=!1}else if(Ue){if(Xe){let K=$e(ee);t.texStorage2D(s.TEXTURE_2D,de,me,K.width,K.height)}z&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,ue,Ie,ee)}else t.texImage2D(s.TEXTURE_2D,0,me,ue,Ie,ee);m(_)&&M(X),ce.__version=le.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function ze(C,_,V){if(_.image.length!==6)return;let X=Qe(C,_),J=_.source;t.bindTexture(s.TEXTURE_CUBE_MAP,C.__webglTexture,s.TEXTURE0+V);let le=n.get(J);if(J.version!==le.__version||X===!0){t.activeTexture(s.TEXTURE0+V);let ce=et.getPrimaries(et.workingColorSpace),$=_.colorSpace===Wn?null:et.getPrimaries(_.colorSpace),ee=_.colorSpace===Wn||ce===$?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(s.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let ue=_.isCompressedTexture||_.image[0].isCompressedTexture,Ie=_.image[0]&&_.image[0].isDataTexture,me=[];for(let ie=0;ie<6;ie++)!ue&&!Ie?me[ie]=p(_.image[ie],!0,i.maxCubemapSize):me[ie]=Ie?_.image[ie].image:_.image[ie],me[ie]=st(_,me[ie]);let fe=me[0],Pe=r.convert(_.format,_.colorSpace),Ue=r.convert(_.type),Xe=y(_.internalFormat,Pe,Ue,_.normalized,_.colorSpace),z=_.isVideoTexture!==!0,de=le.__version===void 0||X===!0,K=J.dataReady,pe=w(_,fe);qe(s.TEXTURE_CUBE_MAP,_);let Me;if(ue){z&&de&&t.texStorage2D(s.TEXTURE_CUBE_MAP,pe,Xe,fe.width,fe.height);for(let ie=0;ie<6;ie++){Me=me[ie].mipmaps;for(let Le=0;Le<Me.length;Le++){let Ce=Me[Le];_.format!==hn?Pe!==null?z?K&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le,0,0,Ce.width,Ce.height,Pe,Ce.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le,Xe,Ce.width,Ce.height,0,Ce.data):Oe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):z?K&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le,0,0,Ce.width,Ce.height,Pe,Ue,Ce.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le,Xe,Ce.width,Ce.height,0,Pe,Ue,Ce.data)}}}else{if(Me=_.mipmaps,z&&de){Me.length>0&&pe++;let ie=$e(me[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,pe,Xe,ie.width,ie.height)}for(let ie=0;ie<6;ie++)if(Ie){z?K&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,me[ie].width,me[ie].height,Pe,Ue,me[ie].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,Xe,me[ie].width,me[ie].height,0,Pe,Ue,me[ie].data);for(let Le=0;Le<Me.length;Le++){let pt=Me[Le].image[ie].image;z?K&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le+1,0,0,pt.width,pt.height,Pe,Ue,pt.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le+1,Xe,pt.width,pt.height,0,Pe,Ue,pt.data)}}else{z?K&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,Pe,Ue,me[ie]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,Xe,Pe,Ue,me[ie]);for(let Le=0;Le<Me.length;Le++){let Ce=Me[Le];z?K&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le+1,0,0,Pe,Ue,Ce.image[ie]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Le+1,Xe,Pe,Ue,Ce.image[ie])}}}m(_)&&M(s.TEXTURE_CUBE_MAP),le.__version=J.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function be(C,_,V,X,J,le){let ce=r.convert(V.format,V.colorSpace),$=r.convert(V.type),ee=y(V.internalFormat,ce,$,V.normalized,V.colorSpace),ue=n.get(_),Ie=n.get(V);if(Ie.__renderTarget=_,!ue.__hasExternalTextures){let me=Math.max(1,_.width>>le),fe=Math.max(1,_.height>>le);J===s.TEXTURE_3D||J===s.TEXTURE_2D_ARRAY?t.texImage3D(J,le,ee,me,fe,_.depth,0,ce,$,null):t.texImage2D(J,le,ee,me,fe,0,ce,$,null)}t.bindFramebuffer(s.FRAMEBUFFER,C),He(_)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,X,J,Ie.__webglTexture,0,Ge(_)):(J===s.TEXTURE_2D||J>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,X,J,Ie.__webglTexture,le),t.bindFramebuffer(s.FRAMEBUFFER,null)}function Ve(C,_,V){if(s.bindRenderbuffer(s.RENDERBUFFER,C),_.depthBuffer){let X=_.depthTexture,J=X&&X.isDepthTexture?X.type:null,le=b(_.stencilBuffer,J),ce=_.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;He(_)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ge(_),le,_.width,_.height):V?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ge(_),le,_.width,_.height):s.renderbufferStorage(s.RENDERBUFFER,le,_.width,_.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,ce,s.RENDERBUFFER,C)}else{let X=_.textures;for(let J=0;J<X.length;J++){let le=X[J],ce=r.convert(le.format,le.colorSpace),$=r.convert(le.type),ee=y(le.internalFormat,ce,$,le.normalized,le.colorSpace);He(_)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ge(_),ee,_.width,_.height):V?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ge(_),ee,_.width,_.height):s.renderbufferStorage(s.RENDERBUFFER,ee,_.width,_.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function lt(C,_,V){let X=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(s.FRAMEBUFFER,C),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let J=n.get(_.depthTexture);if(J.__renderTarget=_,(!J.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),X){if(J.__webglInit===void 0&&(J.__webglInit=!0,_.depthTexture.addEventListener("dispose",A)),J.__webglTexture===void 0){J.__webglTexture=s.createTexture(),t.bindTexture(s.TEXTURE_CUBE_MAP,J.__webglTexture),qe(s.TEXTURE_CUBE_MAP,_.depthTexture);let ue=r.convert(_.depthTexture.format),Ie=r.convert(_.depthTexture.type),me;_.depthTexture.format===Tn?me=s.DEPTH_COMPONENT24:_.depthTexture.format===ci&&(me=s.DEPTH24_STENCIL8);for(let fe=0;fe<6;fe++)s.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0,me,_.width,_.height,0,ue,Ie,null)}}else Q(_.depthTexture,0);let le=J.__webglTexture,ce=Ge(_),$=X?s.TEXTURE_CUBE_MAP_POSITIVE_X+V:s.TEXTURE_2D,ee=_.depthTexture.format===ci?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(_.depthTexture.format===Tn)He(_)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,ee,$,le,0,ce):s.framebufferTexture2D(s.FRAMEBUFFER,ee,$,le,0);else if(_.depthTexture.format===ci)He(_)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,ee,$,le,0,ce):s.framebufferTexture2D(s.FRAMEBUFFER,ee,$,le,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ne(C){let _=n.get(C),V=C.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==C.depthTexture){let X=C.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),X){let J=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,X.removeEventListener("dispose",J)};X.addEventListener("dispose",J),_.__depthDisposeCallback=J}_.__boundDepthTexture=X}if(C.depthTexture&&!_.__autoAllocateDepthBuffer)if(V)for(let X=0;X<6;X++)lt(_.__webglFramebuffer[X],C,X);else{let X=C.texture.mipmaps;X&&X.length>0?lt(_.__webglFramebuffer[0],C,0):lt(_.__webglFramebuffer,C,0)}else if(V){_.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(t.bindFramebuffer(s.FRAMEBUFFER,_.__webglFramebuffer[X]),_.__webglDepthbuffer[X]===void 0)_.__webglDepthbuffer[X]=s.createRenderbuffer(),Ve(_.__webglDepthbuffer[X],C,!1);else{let J=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,le=_.__webglDepthbuffer[X];s.bindRenderbuffer(s.RENDERBUFFER,le),s.framebufferRenderbuffer(s.FRAMEBUFFER,J,s.RENDERBUFFER,le)}}else{let X=C.texture.mipmaps;if(X&&X.length>0?t.bindFramebuffer(s.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=s.createRenderbuffer(),Ve(_.__webglDepthbuffer,C,!1);else{let J=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,le=_.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,le),s.framebufferRenderbuffer(s.FRAMEBUFFER,J,s.RENDERBUFFER,le)}}t.bindFramebuffer(s.FRAMEBUFFER,null)}function se(C,_,V){let X=n.get(C);_!==void 0&&be(X.__webglFramebuffer,C,C.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),V!==void 0&&ne(C)}function re(C){let _=C.texture,V=n.get(C),X=n.get(_);C.addEventListener("dispose",v);let J=C.textures,le=C.isWebGLCubeRenderTarget===!0,ce=J.length>1;if(ce||(X.__webglTexture===void 0&&(X.__webglTexture=s.createTexture()),X.__version=_.version,a.memory.textures++),le){V.__webglFramebuffer=[];for(let $=0;$<6;$++)if(_.mipmaps&&_.mipmaps.length>0){V.__webglFramebuffer[$]=[];for(let ee=0;ee<_.mipmaps.length;ee++)V.__webglFramebuffer[$][ee]=s.createFramebuffer()}else V.__webglFramebuffer[$]=s.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){V.__webglFramebuffer=[];for(let $=0;$<_.mipmaps.length;$++)V.__webglFramebuffer[$]=s.createFramebuffer()}else V.__webglFramebuffer=s.createFramebuffer();if(ce)for(let $=0,ee=J.length;$<ee;$++){let ue=n.get(J[$]);ue.__webglTexture===void 0&&(ue.__webglTexture=s.createTexture(),a.memory.textures++)}if(C.samples>0&&He(C)===!1){V.__webglMultisampledFramebuffer=s.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let $=0;$<J.length;$++){let ee=J[$];V.__webglColorRenderbuffer[$]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,V.__webglColorRenderbuffer[$]);let ue=r.convert(ee.format,ee.colorSpace),Ie=r.convert(ee.type),me=y(ee.internalFormat,ue,Ie,ee.normalized,ee.colorSpace,C.isXRRenderTarget===!0),fe=Ge(C);s.renderbufferStorageMultisample(s.RENDERBUFFER,fe,me,C.width,C.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+$,s.RENDERBUFFER,V.__webglColorRenderbuffer[$])}s.bindRenderbuffer(s.RENDERBUFFER,null),C.depthBuffer&&(V.__webglDepthRenderbuffer=s.createRenderbuffer(),Ve(V.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(le){t.bindTexture(s.TEXTURE_CUBE_MAP,X.__webglTexture),qe(s.TEXTURE_CUBE_MAP,_);for(let $=0;$<6;$++)if(_.mipmaps&&_.mipmaps.length>0)for(let ee=0;ee<_.mipmaps.length;ee++)be(V.__webglFramebuffer[$][ee],C,_,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+$,ee);else be(V.__webglFramebuffer[$],C,_,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);m(_)&&M(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ce){for(let $=0,ee=J.length;$<ee;$++){let ue=J[$],Ie=n.get(ue),me=s.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(me=C.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(me,Ie.__webglTexture),qe(me,ue),be(V.__webglFramebuffer,C,ue,s.COLOR_ATTACHMENT0+$,me,0),m(ue)&&M(me)}t.unbindTexture()}else{let $=s.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&($=C.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture($,X.__webglTexture),qe($,_),_.mipmaps&&_.mipmaps.length>0)for(let ee=0;ee<_.mipmaps.length;ee++)be(V.__webglFramebuffer[ee],C,_,s.COLOR_ATTACHMENT0,$,ee);else be(V.__webglFramebuffer,C,_,s.COLOR_ATTACHMENT0,$,0);m(_)&&M($),t.unbindTexture()}C.depthBuffer&&ne(C)}function ae(C){let _=C.textures;for(let V=0,X=_.length;V<X;V++){let J=_[V];if(m(J)){let le=E(C),ce=n.get(J).__webglTexture;t.bindTexture(le,ce),M(le),t.unbindTexture()}}}let he=[],Ne=[];function De(C){if(C.samples>0){if(He(C)===!1){let _=C.textures,V=C.width,X=C.height,J=s.COLOR_BUFFER_BIT,le=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ce=n.get(C),$=_.length>1;if($)for(let ue=0;ue<_.length;ue++)t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer);let ee=C.texture.mipmaps;ee&&ee.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ce.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let ue=0;ue<_.length;ue++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(J|=s.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(J|=s.STENCIL_BUFFER_BIT)),$){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,ce.__webglColorRenderbuffer[ue]);let Ie=n.get(_[ue]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,Ie,0)}s.blitFramebuffer(0,0,V,X,0,0,V,X,J,s.NEAREST),l===!0&&(he.length=0,Ne.length=0,he.push(s.COLOR_ATTACHMENT0+ue),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(he.push(le),Ne.push(le),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,Ne)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,he))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),$)for(let ue=0;ue<_.length;ue++){t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.RENDERBUFFER,ce.__webglColorRenderbuffer[ue]);let Ie=n.get(_[ue]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.TEXTURE_2D,Ie,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){let _=C.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[_])}}}function Ge(C){return Math.min(i.maxSamples,C.samples)}function He(C){let _=n.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function N(C){let _=a.render.frame;u.get(C)!==_&&(u.set(C,_),C.update())}function st(C,_){let V=C.colorSpace,X=C.format,J=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||V!==Is&&V!==Wn&&(et.getTransfer(V)===ot?(X!==hn||J!==Kt)&&Oe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Fe("WebGLTextures: Unsupported texture color space:",V)),_}function $e(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=O,this.resetTextureUnits=L,this.getTextureUnits=P,this.setTextureUnits=F,this.setTexture2D=Q,this.setTexture2DArray=k,this.setTexture3D=Z,this.setTextureCube=j,this.rebindTextures=se,this.setupRenderTarget=re,this.updateRenderTargetMipmap=ae,this.updateMultisampleRenderTarget=De,this.setupDepthRenderbuffer=ne,this.setupFrameBufferTexture=be,this.useMultisampledRTT=He,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Ox(s,e){function t(n,i=Wn){let r,a=et.getTransfer(i);if(n===Kt)return s.UNSIGNED_BYTE;if(n===Fa)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Oa)return s.UNSIGNED_SHORT_5_5_5_1;if(n===Wl)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===Xl)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===kl)return s.BYTE;if(n===Hl)return s.SHORT;if(n===as)return s.UNSIGNED_SHORT;if(n===Ua)return s.INT;if(n===vn)return s.UNSIGNED_INT;if(n===cn)return s.FLOAT;if(n===yn)return s.HALF_FLOAT;if(n===ql)return s.ALPHA;if(n===Yl)return s.RGB;if(n===hn)return s.RGBA;if(n===Tn)return s.DEPTH_COMPONENT;if(n===ci)return s.DEPTH_STENCIL;if(n===Ba)return s.RED;if(n===za)return s.RED_INTEGER;if(n===hi)return s.RG;if(n===Va)return s.RG_INTEGER;if(n===Ga)return s.RGBA_INTEGER;if(n===or||n===lr||n===cr||n===hr)if(a===ot)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===or)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===lr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===cr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===or)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===lr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===cr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ka||n===Ha||n===Wa||n===Xa)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ka)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ha)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Wa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Xa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===qa||n===Ya||n===Za||n===Ja||n===$a||n===ur||n===Ka)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===qa||n===Ya)return a===ot?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Za)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ja)return r.COMPRESSED_R11_EAC;if(n===$a)return r.COMPRESSED_SIGNED_R11_EAC;if(n===ur)return r.COMPRESSED_RG11_EAC;if(n===Ka)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===ja||n===Qa||n===eo||n===to||n===no||n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho||n===uo)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ja)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Qa)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===eo)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===to)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===no)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===io)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===so)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ro)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ao)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===oo)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===lo)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===co)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ho)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===uo)return a===ot?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===fo||n===po||n===mo)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===fo)return a===ot?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===po)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===mo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===go||n===xo||n===fr||n===_o)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===go)return r.COMPRESSED_RED_RGTC1_EXT;if(n===xo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===fr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===_o)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===os?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}var Bx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,zx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,vc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Vs(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new sn({vertexShader:Bx,fragmentShader:zx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new We(new Rn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},yc=class extends An{constructor(e,t){super();let n=this,i=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,h=null,f=null,d=null,g=null,x=typeof XRWebGLBinding<"u",p=new vc,m={},M=t.getContextAttributes(),E=null,y=null,b=[],w=[],A=new oe,v=null,T=null,R=new Jt;R.viewport=new vt;let I=new Jt;I.viewport=new vt;let U=[R,I],L=new Ra,P=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let te=b[Y];return te===void 0&&(te=new Ki,b[Y]=te),te.getTargetRaySpace()},this.getControllerGrip=function(Y){let te=b[Y];return te===void 0&&(te=new Ki,b[Y]=te),te.getGripSpace()},this.getHand=function(Y){let te=b[Y];return te===void 0&&(te=new Ki,b[Y]=te),te.getHandSpace()};function O(Y){let te=w.indexOf(Y.inputSource);if(te===-1)return;let xe=b[te];xe!==void 0&&(xe.update(Y.inputSource,Y.frame,c||a),xe.dispatchEvent({type:Y.type,data:Y.inputSource}))}function G(){i.removeEventListener("select",O),i.removeEventListener("selectstart",O),i.removeEventListener("selectend",O),i.removeEventListener("squeeze",O),i.removeEventListener("squeezestart",O),i.removeEventListener("squeezeend",O),i.removeEventListener("end",G),i.removeEventListener("inputsourceschange",Q);for(let Y=0;Y<b.length;Y++){let te=w[Y];te!==null&&(w[Y]=null,b[Y].disconnect(te))}P=null,F=null,p.reset();for(let Y in m)delete m[Y];if(e.setRenderTarget(E),d=null,f=null,h=null,i=null,y=null,Qe.stop(),n.isPresenting=!1,e.setPixelRatio(v),e.setSize(A.width,A.height,!1),T!==null){let Y=T.camera;Y.fov=T.fov,Y.zoom=T.zoom,Y.updateProjectionMatrix(),T=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&Oe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===!0&&Oe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Y){c=Y},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return h===null&&x&&(h=new XRWebGLBinding(i,t)),h},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(Y){if(i=Y,i!==null){if(E=e.getRenderTarget(),i.addEventListener("select",O),i.addEventListener("selectstart",O),i.addEventListener("selectend",O),i.addEventListener("squeeze",O),i.addEventListener("squeezestart",O),i.addEventListener("squeezeend",O),i.addEventListener("end",G),i.addEventListener("inputsourceschange",Q),M.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(A),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let xe=null,ze=null,be=null;M.depth&&(be=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,xe=M.stencil?ci:Tn,ze=M.stencil?os:vn);let Ve={colorFormat:t.RGBA8,depthFormat:be,scaleFactor:r};h=this.getBinding(),f=h.createProjectionLayer(Ve),i.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),y=new $t(f.textureWidth,f.textureHeight,{format:hn,type:Kt,depthTexture:new ni(f.textureWidth,f.textureHeight,ze,void 0,void 0,void 0,void 0,void 0,void 0,xe),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let xe={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(i,t,xe),i.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),y=new $t(d.framebufferWidth,d.framebufferHeight,{format:hn,type:Kt,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),Qe.setContext(i),Qe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function Q(Y){for(let te=0;te<Y.removed.length;te++){let xe=Y.removed[te],ze=w.indexOf(xe);ze>=0&&(w[ze]=null,b[ze].disconnect(xe))}for(let te=0;te<Y.added.length;te++){let xe=Y.added[te],ze=w.indexOf(xe);if(ze===-1){for(let Ve=0;Ve<b.length;Ve++)if(Ve>=w.length){w.push(xe),ze=Ve;break}else if(w[Ve]===null){w[Ve]=xe,ze=Ve;break}if(ze===-1)break}let be=b[ze];be&&be.connect(xe)}}let k=new D,Z=new D;function j(Y,te,xe){k.setFromMatrixPosition(te.matrixWorld),Z.setFromMatrixPosition(xe.matrixWorld);let ze=k.distanceTo(Z),be=te.projectionMatrix.elements,Ve=xe.projectionMatrix.elements,lt=be[14]/(be[10]-1),ne=be[14]/(be[10]+1),se=(be[9]+1)/be[5],re=(be[9]-1)/be[5],ae=(be[8]-1)/be[0],he=(Ve[8]+1)/Ve[0],Ne=lt*ae,De=lt*he,Ge=ze/(-ae+he),He=Ge*-ae;if(te.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(He),Y.translateZ(Ge),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),be[10]===-1)Y.projectionMatrix.copy(te.projectionMatrix),Y.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{let N=lt+Ge,st=ne+Ge,$e=Ne-He,C=De+(ze-He),_=se*ne/st*N,V=re*ne/st*N;Y.projectionMatrix.makePerspective($e,C,_,V,N,st),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function Ee(Y,te){te===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(te.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(i===null)return;let te=Y.near,xe=Y.far;p.texture!==null&&(p.depthNear>0&&(te=p.depthNear),p.depthFar>0&&(xe=p.depthFar)),L.near=I.near=R.near=te,L.far=I.far=R.far=xe,(P!==L.near||F!==L.far)&&(i.updateRenderState({depthNear:L.near,depthFar:L.far}),P=L.near,F=L.far),L.layers.mask=Y.layers.mask|6,R.layers.mask=L.layers.mask&-5,I.layers.mask=L.layers.mask&-3;let ze=Y.parent,be=L.cameras;Ee(L,ze);for(let Ve=0;Ve<be.length;Ve++)Ee(be[Ve],ze);be.length===2?j(L,R,I):L.projectionMatrix.copy(R.projectionMatrix),T===null&&Y.isPerspectiveCamera&&(T={camera:Y,fov:Y.fov,zoom:Y.zoom}),ye(Y,L,ze)};function ye(Y,te,xe){xe===null?Y.matrix.copy(te.matrixWorld):(Y.matrix.copy(xe.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(te.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(te.projectionMatrix),Y.projectionMatrixInverse.copy(te.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=ia*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return L},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(Y){l=Y,f!==null&&(f.fixedFoveation=Y),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=Y)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(L)},this.getCameraTexture=function(Y){return m[Y]};let je=null;function qe(Y,te){if(u=te.getViewerPose(c||a),g=te,u!==null){let xe=u.views;d!==null&&(e.setRenderTargetFramebuffer(y,d.framebuffer),e.setRenderTarget(y));let ze=!1;xe.length!==L.cameras.length&&(L.cameras.length=0,ze=!0);for(let ne=0;ne<xe.length;ne++){let se=xe[ne],re=null;if(d!==null)re=d.getViewport(se);else{let he=h.getViewSubImage(f,se);re=he.viewport,ne===0&&(e.setRenderTargetTextures(y,he.colorTexture,he.depthStencilTexture),e.setRenderTarget(y))}let ae=U[ne];ae===void 0&&(ae=new Jt,ae.layers.enable(ne),ae.viewport=new vt,U[ne]=ae),ae.matrix.fromArray(se.transform.matrix),ae.matrix.decompose(ae.position,ae.quaternion,ae.scale),ae.projectionMatrix.fromArray(se.projectionMatrix),ae.projectionMatrixInverse.copy(ae.projectionMatrix).invert(),ae.viewport.set(re.x,re.y,re.width,re.height),ne===0&&(L.matrix.copy(ae.matrix),L.matrix.decompose(L.position,L.quaternion,L.scale)),ze===!0&&L.cameras.push(ae)}let be=i.enabledFeatures;if(be&&be.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&x){h=n.getBinding();let ne=h.getDepthInformation(xe[0]);ne&&ne.isValid&&ne.texture&&p.init(ne,i.renderState)}if(be&&be.includes("camera-access")&&x){e.state.unbindTexture(),h=n.getBinding();for(let ne=0;ne<xe.length;ne++){let se=xe[ne].camera;if(se){let re=m[se];re||(re=new Vs,m[se]=re);let ae=h.getCameraImage(se);re.sourceTexture=ae}}}}for(let xe=0;xe<b.length;xe++){let ze=w[xe],be=b[xe];ze!==null&&be!==void 0&&be.update(ze,te,c||a)}je&&je(Y,te),te.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:te}),g=null}let Qe=new Bu;Qe.setAnimationLoop(qe),this.setAnimationLoop=function(Y){je=Y},this.dispose=function(){}}},Vx=new tt,Wu=new ke;Wu.set(-1,0,0,0,1,0,0,0,1);function Gx(s,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,Kl(s)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function i(p,m,M,E,y){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(p,m):m.isMeshLambertMaterial?(r(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(p,m),h(p,m)):m.isMeshPhongMaterial?(r(p,m),u(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(p,m),f(p,m),m.isMeshPhysicalMaterial&&d(p,m,y)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),x(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?l(p,m,M,E):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Xt&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Xt&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let M=e.get(m),E=M.envMap,y=M.envMapRotation;E&&(p.envMap.value=E,p.envMapRotation.value.setFromMatrix4(Vx.makeRotationFromEuler(y)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Wu),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,M,E){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*M,p.scale.value=E*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function u(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function h(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function f(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function d(p,m,M){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Xt&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.retroreflectivity>0&&(p.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=M.texture,p.transmissionSamplerSize.value.set(M.width,M.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function x(p,m){let M=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(M.matrixWorld),p.nearDistance.value=M.shadow.camera.near,p.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function kx(s,e,t,n){let i={},r={},a=[],o=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,b){let w=b.program;n.uniformBlockBinding(y,w)}function c(y,b){let w=i[y.id];w===void 0&&(p(y),w=u(y),i[y.id]=w,y.addEventListener("dispose",M));let A=b.program;n.updateUBOMapping(y,A);let v=e.render.frame;r[y.id]!==v&&(f(y),r[y.id]=v)}function u(y){let b=h();y.__bindingPointIndex=b;let w=s.createBuffer(),A=y.__size,v=y.usage;return s.bindBuffer(s.UNIFORM_BUFFER,w),s.bufferData(s.UNIFORM_BUFFER,A,v),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,b,w),w}function h(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return Fe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(y){let b=i[y.id],w=y.uniforms,A=y.__cache;s.bindBuffer(s.UNIFORM_BUFFER,b);for(let v=0,T=w.length;v<T;v++){let R=w[v];if(Array.isArray(R))for(let I=0,U=R.length;I<U;I++)d(R[I],v,I,A);else d(R,v,0,A)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function d(y,b,w,A){if(x(y,b,w,A)===!0){let v=y.__offset,T=y.value;if(Array.isArray(T)){let R=0;for(let I=0;I<T.length;I++){let U=T[I],L=m(U);g(U,y.__data,R),typeof U!="number"&&typeof U!="boolean"&&!U.isMatrix3&&!ArrayBuffer.isView(U)&&(R+=L.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(T,y.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,v,y.__data)}}function g(y,b,w){typeof y=="number"||typeof y=="boolean"?b[0]=y:y.isMatrix3?(b[0]=y.elements[0],b[1]=y.elements[1],b[2]=y.elements[2],b[3]=0,b[4]=y.elements[3],b[5]=y.elements[4],b[6]=y.elements[5],b[7]=0,b[8]=y.elements[6],b[9]=y.elements[7],b[10]=y.elements[8],b[11]=0):ArrayBuffer.isView(y)?b.set(new y.constructor(y.buffer,y.byteOffset,b.length)):y.toArray(b,w)}function x(y,b,w,A){let v=y.value,T=b+"_"+w;if(A[T]===void 0)return typeof v=="number"||typeof v=="boolean"?A[T]=v:ArrayBuffer.isView(v)?A[T]=v.slice():A[T]=v.clone(),!0;{let R=A[T];if(typeof v=="number"||typeof v=="boolean"){if(R!==v)return A[T]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(R.equals(v)===!1)return R.copy(v),!0}}return!1}function p(y){let b=y.uniforms,w=0,A=16;for(let T=0,R=b.length;T<R;T++){let I=Array.isArray(b[T])?b[T]:[b[T]];for(let U=0,L=I.length;U<L;U++){let P=I[U],F=Array.isArray(P.value)?P.value:[P.value];for(let O=0,G=F.length;O<G;O++){let Q=F[O],k=m(Q),Z=w%A,j=Z%k.boundary,Ee=Z+j;w+=j,Ee!==0&&A-Ee<k.storage&&(w+=A-Ee),P.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),P.__offset=w,w+=k.storage}}}let v=w%A;return v>0&&(w+=A-v),y.__size=w,y.__cache={},this}function m(y){let b={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(b.boundary=4,b.storage=4):y.isVector2?(b.boundary=8,b.storage=8):y.isVector3||y.isColor?(b.boundary=16,b.storage=12):y.isVector4?(b.boundary=16,b.storage=16):y.isMatrix3?(b.boundary=48,b.storage=48):y.isMatrix4?(b.boundary=64,b.storage=64):y.isTexture?Oe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(b.boundary=16,b.storage=y.byteLength):Oe("WebGLRenderer: Unsupported uniform value type.",y),b}function M(y){let b=y.target;b.removeEventListener("dispose",M);let w=a.indexOf(b.__bindingPointIndex);a.splice(w,1),s.deleteBuffer(i[b.id]),delete i[b.id],delete r[b.id]}function E(){for(let y in i)s.deleteBuffer(i[y]);a=[],i={},r={}}return{bind:l,update:c,dispose:E}}var Hx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ln=null;function Wx(){return Ln===null&&(Ln=new Bs(Hx,16,16,hi,yn),Ln.name="DFG_LUT",Ln.minFilter=Rt,Ln.magFilter=Rt,Ln.wrapS=tn,Ln.wrapT=tn,Ln.generateMipmaps=!1,Ln.needsUpdate=!0),Ln}var To=class{constructor(e={}){let{canvas:t=ru(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:f=!1,outputBufferType:d=Kt}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;let x=d,p=new Set([Ga,Va,za]),m=new Set([Kt,vn,as,os,Fa,Oa]),M=new Uint32Array(4),E=new Int32Array(4),y=new D,b=null,w=null,A=[],v=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=_n,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let R=this,I=!1,U=null,L=null,P=null,F=null;this._outputColorSpace=Ct;let O=0,G=0,Q=null,k=-1,Z=null,j=new vt,Ee=new vt,ye=null,je=new Be(0),qe=0,Qe=t.width,Y=t.height,te=1,xe=null,ze=null,be=new vt(0,0,Qe,Y),Ve=new vt(0,0,Qe,Y),lt=!1,ne=new Qi,se=!1,re=!1,ae=new tt,he=new D,Ne=new vt,De={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ge=!1;function He(){return Q===null?te:1}let N=n;function st(S,B){return t.getContext(S,B)}let $e,C,_,V,X,J,le,ce,$,ee,ue,Ie,me,fe,Pe,Ue,Xe,z,de,K,pe,Me,ie;try{let S={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",pt,!1),t.addEventListener("webglcontextrestored",rt,!1),t.addEventListener("webglcontextcreationerror",un,!1),N===null){let B="webgl2";if(N=st(B,S),N===null)throw st(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Le()}catch(S){throw t.removeEventListener("webglcontextlost",pt,!1),t.removeEventListener("webglcontextrestored",rt,!1),t.removeEventListener("webglcontextcreationerror",un,!1),Fe("WebGLRenderer: "+S.message),S}function Le(){$e=new K0(N),$e.init(),pe=new Ox(N,$e),C=new G0(N,$e,e,pe),_=new Ux(N,$e),C.reversedDepthBuffer&&f&&_.buffers.depth.setReversed(!0),L=N.createFramebuffer(),P=N.createFramebuffer(),F=N.createFramebuffer(),V=new eg(N),X=new Mx,J=new Fx(N,$e,_,X,C,pe,V),le=new $0(R),ce=new np(N),Me=new z0(N,ce),$=new j0(N,ce,V,Me),ee=new ng(N,$,ce,Me,V),z=new tg(N,C,J),Pe=new k0(X),ue=new yx(R,le,$e,C,Me,Pe),Ie=new Gx(R,X),me=new Sx,fe=new Rx($e),Xe=new B0(R,le,_,ee,g,l),Ue=new Nx(R,ee,C),ie=new kx(N,V,C,_),de=new V0(N,$e,V),K=new Q0(N,$e,V),V.programs=ue.programs,R.capabilities=C,R.extensions=$e,R.properties=X,R.renderLists=me,R.shadowMap=Ue,R.state=_,R.info=V}x!==Kt&&(T=new sg(x,t.width,t.height,o,i,r));let Ce=new yc(R,N);this.xr=Ce,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let S=$e.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=$e.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return te},this.setPixelRatio=function(S){S!==void 0&&(te=S,this.setSize(Qe,Y,!1))},this.getSize=function(S){return S.set(Qe,Y)},this.setSize=function(S,B,q=!0){if(Ce.isPresenting){Oe("WebGLRenderer: Can't change size while VR device is presenting.");return}Qe=S,Y=B,t.width=Math.floor(S*te),t.height=Math.floor(B*te),q===!0&&(t.style.width=S+"px",t.style.height=B+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,S,B)},this.getDrawingBufferSize=function(S){return S.set(Qe*te,Y*te).floor()},this.setDrawingBufferSize=function(S,B,q){Qe=S,Y=B,te=q,t.width=Math.floor(S*q),t.height=Math.floor(B*q),this.setViewport(0,0,S,B)},this.setEffects=function(S){if(x===Kt){Fe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(S){for(let B=0;B<S.length;B++)if(S[B].isOutputPass===!0){Oe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(S||[])},this.getCurrentViewport=function(S){return S.copy(j)},this.getViewport=function(S){return S.copy(be)},this.setViewport=function(S,B,q,H){S.isVector4?be.set(S.x,S.y,S.z,S.w):be.set(S,B,q,H),_.viewport(j.copy(be).multiplyScalar(te).round())},this.getScissor=function(S){return S.copy(Ve)},this.setScissor=function(S,B,q,H){S.isVector4?Ve.set(S.x,S.y,S.z,S.w):Ve.set(S,B,q,H),_.scissor(Ee.copy(Ve).multiplyScalar(te).round())},this.getScissorTest=function(){return lt},this.setScissorTest=function(S){_.setScissorTest(lt=S)},this.setOpaqueSort=function(S){xe=S},this.setTransparentSort=function(S){ze=S},this.getClearColor=function(S){return S.copy(Xe.getClearColor())},this.setClearColor=function(){Xe.setClearColor(...arguments)},this.getClearAlpha=function(){return Xe.getClearAlpha()},this.setClearAlpha=function(){Xe.setClearAlpha(...arguments)},this.clear=function(S=!0,B=!0,q=!0){let H=0;if(S){let W=!1;if(Q!==null){let ve=Q.texture.format;W=p.has(ve)}if(W){let ve=Q.texture.type,we=m.has(ve),_e=Xe.getClearColor(),Te=Xe.getClearAlpha(),Re=_e.r,Ye=_e.g,Ke=_e.b;we?(M[0]=Re,M[1]=Ye,M[2]=Ke,M[3]=Te,N.clearBufferuiv(N.COLOR,0,M)):(E[0]=Re,E[1]=Ye,E[2]=Ke,E[3]=Te,N.clearBufferiv(N.COLOR,0,E))}else H|=N.COLOR_BUFFER_BIT}B&&(H|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),q&&(H|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),H!==0&&N.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(S){S.setRenderer(this),U=S},this.dispose=function(){t.removeEventListener("webglcontextlost",pt,!1),t.removeEventListener("webglcontextrestored",rt,!1),t.removeEventListener("webglcontextcreationerror",un,!1),Xe.dispose(),me.dispose(),fe.dispose(),X.dispose(),le.dispose(),ee.dispose(),Me.dispose(),ie.dispose(),ue.dispose(),Ce.dispose(),Ce.removeEventListener("sessionstart",zc),Ce.removeEventListener("sessionend",Vc),fi.stop()};function pt(S){S.preventDefault(),Jl("WebGLRenderer: Context Lost."),I=!0}function rt(){Jl("WebGLRenderer: Context Restored."),I=!1;let S=V.autoReset,B=Ue.enabled,q=Ue.autoUpdate,H=Ue.needsUpdate,W=Ue.type;Le(),V.autoReset=S,Ue.enabled=B,Ue.autoUpdate=q,Ue.needsUpdate=H,Ue.type=W}function un(S){Fe("WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function bn(S){let B=S.target;B.removeEventListener("dispose",bn),Nf(B)}function Nf(S){Uf(S),X.remove(S)}function Uf(S){let B=X.get(S).programs;B!==void 0&&(B.forEach(function(q){ue.releaseProgram(q)}),S.isShaderMaterial&&ue.releaseShaderCache(S))}this.renderBufferDirect=function(S,B,q,H,W,ve){B===null&&(B=De);let we=W.isMesh&&W.matrixWorld.determinantAffine()<0,_e=Bf(S,B,q,H,W);_.setMaterial(H,we);let Te=q.index,Re=1;if(H.wireframe===!0){if(Te=$.getWireframeAttribute(q),Te===void 0)return;Re=2}let Ye=q.drawRange,Ke=q.attributes.position,Ae=Ye.start*Re,at=(Ye.start+Ye.count)*Re;ve!==null&&(Ae=Math.max(Ae,ve.start*Re),at=Math.min(at,(ve.start+ve.count)*Re)),Te!==null?(Ae=Math.max(Ae,0),at=Math.min(at,Te.count)):Ke!=null&&(Ae=Math.max(Ae,0),at=Math.min(at,Ke.count));let St=at-Ae;if(St<0||St===1/0)return;Me.setup(W,H,_e,q,Te);let gt,ft=de;if(Te!==null&&(gt=ce.get(Te),ft=K,ft.setIndex(gt)),W.isMesh)H.wireframe===!0?(_.setLineWidth(H.wireframeLinewidth*He()),ft.setMode(N.LINES)):ft.setMode(N.TRIANGLES);else if(W.isLine){let Ot=H.linewidth;Ot===void 0&&(Ot=1),_.setLineWidth(Ot*He()),W.isLineSegments?ft.setMode(N.LINES):W.isLineLoop?ft.setMode(N.LINE_LOOP):ft.setMode(N.LINE_STRIP)}else W.isPoints?ft.setMode(N.POINTS):W.isSprite&&ft.setMode(N.TRIANGLES);if(W.isBatchedMesh)if($e.get("WEBGL_multi_draw"))ft.renderMultiDraw(W._multiDrawStarts,W._multiDrawCounts,W._multiDrawCount);else{let Ot=W._multiDrawStarts,Se=W._multiDrawCounts,Ht=W._multiDrawCount,nt=Te?ce.get(Te).bytesPerElement:1,an=X.get(H).currentProgram.getUniforms();for(let Sn=0;Sn<Ht;Sn++)an.setValue(N,"_gl_DrawID",Sn),ft.render(Ot[Sn]/nt,Se[Sn])}else if(W.isInstancedMesh)ft.renderInstances(Ae,St,W.count);else if(q.isInstancedBufferGeometry){let Ot=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,Se=Math.min(q.instanceCount,Ot);ft.renderInstances(Ae,St,Se)}else ft.render(Ae,St)};function Bc(S,B,q,H){U!==null&&S.isNodeMaterial&&U.setObject(H,S),se===!0&&Pe.setState(S,q,!1),S.transparent===!0&&S.side===ln&&S.forceSinglePass===!1?(S.side=Xt,S.needsUpdate=!0,Sr(S,B,H),S.side=oi,S.needsUpdate=!0,Sr(S,B,H),S.side=ln):Sr(S,B,H)}this.compile=function(S,B,q=null){q===null&&(q=S),U!==null&&U.renderStart(S,B,q),w=fe.get(q),w.init(B),v.push(w),q.traverseVisible(function(W){W.isLight&&W.layers.test(B.layers)&&(w.pushLight(W),W.castShadow&&w.pushShadow(W))}),S!==q&&S.traverseVisible(function(W){W.isLight&&W.layers.test(B.layers)&&(w.pushLight(W),W.castShadow&&w.pushShadow(W))}),w.setupLights(),U!==null&&U.updateLights(w.state.lightsArray),re=this.localClippingEnabled,se=Pe.init(this.clippingPlanes,re),se===!0&&Pe.setGlobalState(this.clippingPlanes,B),U!==null&&Ue.render(w.state.shadowsArray,q,B);let H=new Set;return S.traverse(function(W){if(!(W.isMesh||W.isPoints||W.isLine||W.isSprite))return;let ve=W.material;if(ve)if(Array.isArray(ve))for(let we=0;we<ve.length;we++){let _e=ve[we];Bc(_e,q,B,W),H.add(_e)}else Bc(ve,q,B,W),H.add(ve)}),w=v.pop(),U!==null&&U.renderEnd(),H},this.compileAsync=function(S,B,q=null){let H=this.compile(S,B,q);return new Promise(W=>{function ve(){if(H.forEach(function(we){let Te=X.get(we).currentProgram;(Te===void 0||Te.isReady())&&H.delete(we)}),H.size===0){W(S);return}setTimeout(ve,10)}$e.get("KHR_parallel_shader_compile")!==null?ve():setTimeout(ve,10)})};let ko=null;function Ff(S){ko&&ko(S)}function zc(){fi.stop()}function Vc(){fi.start()}let fi=new Bu;fi.setAnimationLoop(Ff),typeof self<"u"&&fi.setContext(self),this.setAnimationLoop=function(S){ko=S,Ce.setAnimationLoop(S),S===null?fi.stop():fi.start()},Ce.addEventListener("sessionstart",zc),Ce.addEventListener("sessionend",Vc),this.render=function(S,B){if(B!==void 0&&B.isCamera!==!0){Fe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;U!==null&&U.renderStart(S,B);let q=Ce.enabled===!0&&Ce.isPresenting===!0,H=T!==null&&(Q===null||q)&&T.begin(R,Q);if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),Ce.enabled===!0&&Ce.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Ce.cameraAutoUpdate===!0&&Ce.updateCamera(B),B=Ce.getCamera()),S.isScene===!0&&S.onBeforeRender(R,S,B,Q),w=fe.get(S,v.length),w.init(B),w.state.textureUnits=J.getTextureUnits(),v.push(w),ae.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),ne.setFromProjectionMatrix(ae,mn,B.reversedDepth),re=this.localClippingEnabled,se=Pe.init(this.clippingPlanes,re),b=me.get(S,A.length),b.init(),A.push(b),Ce.enabled===!0&&Ce.isPresenting===!0){let we=R.xr.getDepthSensingMesh();we!==null&&Ho(we,B,-1/0,R.sortObjects)}Ho(S,B,0,R.sortObjects),b.finish(),U!==null&&U.updateLights(w.state.lightsArray),R.sortObjects===!0&&b.sort(xe,ze),Ge=Ce.enabled===!1||Ce.isPresenting===!1||Ce.hasDepthSensing()===!1,Ge&&Xe.addToRenderList(b,S),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),se===!0&&Pe.beginShadows();let W=w.state.shadowsArray;if(Ue.render(W,S,B),se===!0&&Pe.endShadows(),(H&&T.hasRenderPass())===!1){let we=b.opaque,_e=b.transmissive;if(w.setupLights(),B.isArrayCamera){let Te=B.cameras;if(_e.length>0)for(let Re=0,Ye=Te.length;Re<Ye;Re++){let Ke=Te[Re];kc(we,_e,S,Ke)}Ge&&Xe.render(S);for(let Re=0,Ye=Te.length;Re<Ye;Re++){let Ke=Te[Re];Gc(b,S,Ke,Ke.viewport)}}else _e.length>0&&kc(we,_e,S,B),Ge&&Xe.render(S),Gc(b,S,B)}Q!==null&&G===0&&(J.updateMultisampleRenderTarget(Q),J.updateRenderTargetMipmap(Q)),H&&T.end(R),S.isScene===!0&&S.onAfterRender(R,S,B),Me.resetDefaultState(),k=-1,Z=null,v.pop(),v.length>0?(w=v[v.length-1],J.setTextureUnits(w.state.textureUnits),se===!0&&Pe.setGlobalState(R.clippingPlanes,w.state.camera)):w=null,A.pop(),A.length>0?b=A[A.length-1]:b=null,U!==null&&U.renderEnd()};function Ho(S,B,q,H){if(S.visible===!1)return;if(S.layers.test(B.layers)){if(S.isGroup)q=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(B);else if(S.isLightProbeGrid)w.pushLightProbeGrid(S);else if(S.isLight)w.pushLight(S),S.castShadow&&w.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||S.intersectsFrustum(ne)){H&&Ne.setFromMatrixPosition(S.matrixWorld).applyMatrix4(ae);let we=ee.update(S),_e=S.material;_e.visible&&b.push(S,we,_e,q,Ne.z,null,B)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||S.intersectsFrustum(ne))){let we=ee.update(S),_e=S.material;if(H&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),Ne.copy(S.boundingSphere.center)):(we.boundingSphere===null&&we.computeBoundingSphere(),Ne.copy(we.boundingSphere.center)),Ne.applyMatrix4(S.matrixWorld).applyMatrix4(ae)),Array.isArray(_e)){let Te=we.groups;for(let Re=0,Ye=Te.length;Re<Ye;Re++){let Ke=Te[Re],Ae=_e[Ke.materialIndex];Ae&&Ae.visible&&b.push(S,we,Ae,q,Ne.z,Ke,B)}}else _e.visible&&b.push(S,we,_e,q,Ne.z,null,B)}}let ve=S.children;for(let we=0,_e=ve.length;we<_e;we++)Ho(ve[we],B,q,H)}function Gc(S,B,q,H){let{opaque:W,transmissive:ve,transparent:we}=S;w.setupLightsView(q),se===!0&&Pe.setGlobalState(R.clippingPlanes,q),H&&_.viewport(j.copy(H)),W.length>0&&br(W,B,q),ve.length>0&&br(ve,B,q),we.length>0&&br(we,B,q),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function kc(S,B,q,H){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[H.id]===void 0){let Ae=$e.has("EXT_color_buffer_half_float")||$e.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[H.id]=new $t(1,1,{generateMipmaps:!0,type:Ae?yn:Kt,minFilter:Pn,samples:Math.max(4,C.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:et.workingColorSpace})}let ve=w.state.transmissionRenderTarget[H.id],we=H.viewport||j;ve.setSize(we.z*R.transmissionResolutionScale,we.w*R.transmissionResolutionScale);let _e=R.getRenderTarget(),Te=R.getActiveCubeFace(),Re=R.getActiveMipmapLevel();R.setRenderTarget(ve),R.getClearColor(je),qe=R.getClearAlpha(),qe<1&&R.setClearColor(16777215,.5),R.clear(),Ge&&Xe.render(q);let Ye=R.toneMapping;R.toneMapping=_n;let Ke=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),w.setupLightsView(H),se===!0&&Pe.setGlobalState(R.clippingPlanes,H),br(S,q,H),J.updateMultisampleRenderTarget(ve),J.updateRenderTargetMipmap(ve),$e.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let at=0,St=B.length;at<St;at++){let gt=B[at],{object:ft,geometry:Ot,material:Se,group:Ht}=gt;if(Se.side===ln&&ft.layers.test(H.layers)){let nt=Se.side;Se.side=Xt,Se.needsUpdate=!0,Hc(ft,q,H,Ot,Se,Ht),Se.side=nt,Se.needsUpdate=!0,Ae=!0}}Ae===!0&&(J.updateMultisampleRenderTarget(ve),J.updateRenderTargetMipmap(ve))}R.setRenderTarget(_e,Te,Re),R.setClearColor(je,qe),Ke!==void 0&&(H.viewport=Ke),R.toneMapping=Ye}function br(S,B,q){let H=B.isScene===!0?B.overrideMaterial:null;for(let W=0,ve=S.length;W<ve;W++){let we=S[W],{object:_e,geometry:Te,group:Re}=we,Ye=we.material;Ye.allowOverride===!0&&H!==null&&(Ye=H),_e.layers.test(q.layers)&&Hc(_e,B,q,Te,Ye,Re)}}function Hc(S,B,q,H,W,ve){U!==null&&W.isNodeMaterial&&U.setObject(S,W),S.onBeforeRender(R,B,q,H,W,ve),S.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),W.onBeforeRender(R,B,q,H,S,ve),W.transparent===!0&&W.side===ln&&W.forceSinglePass===!1?(W.side=Xt,W.needsUpdate=!0,R.renderBufferDirect(q,B,H,W,S,ve),W.side=oi,W.needsUpdate=!0,R.renderBufferDirect(q,B,H,W,S,ve),W.side=ln):R.renderBufferDirect(q,B,H,W,S,ve),S.onAfterRender(R,B,q,H,W,ve)}function Sr(S,B,q){B.isScene!==!0&&(B=De);let H=X.get(S),W=w.state.lights,ve=w.state.shadowsArray,we=W.state.version,_e=ue.getParameters(S,W.state,ve,B,q,w.state.lightProbeGridArray),Te=ue.getProgramCacheKey(_e),Re=H.programs;H.environment=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?B.environment:null,H.fog=B.fog;let Ye=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap;H.envMap=le.get(S.envMap||H.environment,Ye),H.envMapRotation=H.environment!==null&&S.envMap===null?B.environmentRotation:S.envMapRotation,Re===void 0&&(S.addEventListener("dispose",bn),Re=new Map,H.programs=Re);let Ke=Re.get(Te);if(Ke!==void 0){if(H.currentProgram===Ke&&H.lightsStateVersion===we)return Xc(S,_e),Ke}else _e.uniforms=ue.getUniforms(S),U!==null&&S.isNodeMaterial&&U.build(S,q,_e),S.onBeforeCompile(_e,R),Ke=ue.acquireProgram(_e,Te),Re.set(Te,Ke),H.uniforms=_e.uniforms;let Ae=H.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ae.clippingPlanes=Pe.uniform),Xc(S,_e),H.needsLights=Vf(S),H.lightsStateVersion=we,H.needsLights&&(Ae.ambientLightColor.value=W.state.ambient,Ae.lightProbe.value=W.state.probe,Ae.sunLights.value=W.state.sun,Ae.sunLightShadows.value=W.state.sunShadow,Ae.directionalLights.value=W.state.directional,Ae.directionalLightShadows.value=W.state.directionalShadow,Ae.spotLights.value=W.state.spot,Ae.spotLightShadows.value=W.state.spotShadow,Ae.rectAreaLights.value=W.state.rectArea,Ae.ltc_1.value=W.state.rectAreaLTC1,Ae.ltc_2.value=W.state.rectAreaLTC2,Ae.pointLights.value=W.state.point,Ae.pointLightShadows.value=W.state.pointShadow,Ae.hemisphereLights.value=W.state.hemi,Ae.sunShadowMatrix.value=W.state.sunShadowMatrix,Ae.sunShadowCascade.value=W.state.sunShadowCascade,Ae.directionalShadowMatrix.value=W.state.directionalShadowMatrix,Ae.spotLightMatrix.value=W.state.spotLightMatrix,Ae.spotLightMap.value=W.state.spotLightMap,Ae.pointShadowMatrix.value=W.state.pointShadowMatrix),H.lightProbeGrid=w.state.lightProbeGridArray.length>0,H.currentProgram=Ke,H.uniformsList=null,Ke}function Wc(S){if(S.uniformsList===null){let B=S.currentProgram.getUniforms();S.uniformsList=us.seqWithValue(B.seq,S.uniforms)}return S.uniformsList}function Xc(S,B){let q=X.get(S);q.outputColorSpace=B.outputColorSpace,q.batching=B.batching,q.batchingColor=B.batchingColor,q.instancing=B.instancing,q.instancingColor=B.instancingColor,q.instancingMorph=B.instancingMorph,q.skinning=B.skinning,q.morphTargets=B.morphTargets,q.morphNormals=B.morphNormals,q.morphColors=B.morphColors,q.morphTargetsCount=B.morphTargetsCount,q.numClippingPlanes=B.numClippingPlanes,q.numIntersection=B.numClipIntersection,q.vertexAlphas=B.vertexAlphas,q.vertexTangents=B.vertexTangents,q.toneMapping=B.toneMapping}function Of(S,B){if(S.length===0)return null;if(S.length===1)return S[0].texture!==null?S[0]:null;y.setFromMatrixPosition(B.matrixWorld);for(let q=0,H=S.length;q<H;q++){let W=S[q];if(W.texture!==null&&W.boundingBox.containsPoint(y))return W}return null}function Bf(S,B,q,H,W){B.isScene!==!0&&(B=De),J.resetTextureUnits();let ve=B.fog,we=H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial?B.environment:null,_e=Q===null?R.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:et.workingColorSpace,Te=H.isMeshStandardMaterial||H.isMeshLambertMaterial&&!H.envMap||H.isMeshPhongMaterial&&!H.envMap,Re=le.get(H.envMap||we,Te),Ye=H.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Ke=!!q.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Ae=!!q.morphAttributes.position,at=!!q.morphAttributes.normal,St=!!q.morphAttributes.color,gt=_n;H.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(gt=R.toneMapping);let ft=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,Ot=ft!==void 0?ft.length:0,Se=X.get(H),Ht=w.state.lights;if(se===!0&&(re===!0||S!==Z)){let mt=S===Z&&H.id===k;Pe.setState(H,S,mt)}let nt=!1;H.version===Se.__version?(Se.needsLights&&Se.lightsStateVersion!==Ht.state.version||Se.outputColorSpace!==_e||W.isBatchedMesh&&Se.batching===!1||!W.isBatchedMesh&&Se.batching===!0||W.isBatchedMesh&&Se.batchingColor===!0&&W._colorsTexture===null||W.isBatchedMesh&&Se.batchingColor===!1&&W._colorsTexture!==null||W.isInstancedMesh&&Se.instancing===!1||!W.isInstancedMesh&&Se.instancing===!0||W.isSkinnedMesh&&Se.skinning===!1||!W.isSkinnedMesh&&Se.skinning===!0||W.isInstancedMesh&&Se.instancingColor===!0&&W.instanceColor===null||W.isInstancedMesh&&Se.instancingColor===!1&&W.instanceColor!==null||W.isInstancedMesh&&Se.instancingMorph===!0&&W.morphTexture===null||W.isInstancedMesh&&Se.instancingMorph===!1&&W.morphTexture!==null||Se.envMap!==Re||H.fog===!0&&Se.fog!==ve||Se.numClippingPlanes!==void 0&&(Se.numClippingPlanes!==Pe.numPlanes||Se.numIntersection!==Pe.numIntersection)||Se.vertexAlphas!==Ye||Se.vertexTangents!==Ke||Se.morphTargets!==Ae||Se.morphNormals!==at||Se.morphColors!==St||Se.toneMapping!==gt||Se.morphTargetsCount!==Ot||!!Se.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(nt=!0):(nt=!0,Se.__version=H.version);let an=Se.currentProgram;nt===!0&&(an=Sr(H,B,W),U&&H.isNodeMaterial&&U.onUpdateProgram(H,an,Se));let Sn=!1,Xn=!1,Ri=!1,ht=an.getUniforms(),bt=Se.uniforms;if(_.useProgram(an.program)&&(Sn=!0,Xn=!0,Ri=!0),H.id!==k&&(k=H.id,Xn=!0),Se.needsLights){let mt=Of(w.state.lightProbeGridArray,W);Se.lightProbeGrid!==mt&&(Se.lightProbeGrid=mt,Xn=!0)}if(Sn||Z!==S){_.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),ht.setValue(N,"projectionMatrix",S.projectionMatrix),ht.setValue(N,"viewMatrix",S.matrixWorldInverse);let Yn=ht.map.cameraPosition;Yn!==void 0&&Yn.setValue(N,he.setFromMatrixPosition(S.matrixWorld)),C.logarithmicDepthBuffer&&ht.setValue(N,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&ht.setValue(N,"isOrthographic",S.isOrthographicCamera===!0),Z!==S&&(Z=S,Xn=!0,Ri=!0)}if(Se.needsLights&&(Ht.state.sunShadowMap.length>0&&ht.setValue(N,"sunShadowMap",Ht.state.sunShadowMap,J),Ht.state.directionalShadowMap.length>0&&ht.setValue(N,"directionalShadowMap",Ht.state.directionalShadowMap,J),Ht.state.spotShadowMap.length>0&&ht.setValue(N,"spotShadowMap",Ht.state.spotShadowMap,J),Ht.state.pointShadowMap.length>0&&ht.setValue(N,"pointShadowMap",Ht.state.pointShadowMap,J)),W.isSkinnedMesh){ht.setOptional(N,W,"bindMatrix"),ht.setOptional(N,W,"bindMatrixInverse");let mt=W.skeleton;mt&&(mt.boneTexture===null&&mt.computeBoneTexture(),ht.setValue(N,"boneTexture",mt.boneTexture,J))}W.isBatchedMesh&&(ht.setOptional(N,W,"batchingTexture"),ht.setValue(N,"batchingTexture",W._matricesTexture,J),ht.setOptional(N,W,"batchingIdTexture"),ht.setValue(N,"batchingIdTexture",W._indirectTexture,J),ht.setOptional(N,W,"batchingColorTexture"),W._colorsTexture!==null&&ht.setValue(N,"batchingColorTexture",W._colorsTexture,J));let qn=q.morphAttributes;if((qn.position!==void 0||qn.normal!==void 0||qn.color!==void 0)&&z.update(W,q,an),(Xn||Se.receiveShadow!==W.receiveShadow)&&(Se.receiveShadow=W.receiveShadow,ht.setValue(N,"receiveShadow",W.receiveShadow)),(H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial)&&H.envMap===null&&B.environment!==null&&(bt.envMapIntensity.value=B.environmentIntensity),bt.dfgLUT!==void 0&&(bt.dfgLUT.value=Wx()),Xn){if(ht.setValue(N,"toneMappingExposure",R.toneMappingExposure),Se.needsLights&&zf(bt,Ri),ve&&H.fog===!0&&Ie.refreshFogUniforms(bt,ve),Ie.refreshMaterialUniforms(bt,H,te,Y,w.state.transmissionRenderTarget[S.id]),Se.needsLights&&Se.lightProbeGrid){let mt=Se.lightProbeGrid;bt.probesSH.value=mt.texture,bt.probesMin.value.copy(mt.boundingBox.min),bt.probesMax.value.copy(mt.boundingBox.max),bt.probesResolution.value.copy(mt.resolution)}us.upload(N,Wc(Se),bt,J)}if(H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(us.upload(N,Wc(Se),bt,J),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&ht.setValue(N,"center",W.center),ht.setValue(N,"modelViewMatrix",W.modelViewMatrix),ht.setValue(N,"normalMatrix",W.normalMatrix),ht.setValue(N,"modelMatrix",W.matrixWorld),H.uniformsGroups!==void 0){let mt=H.uniformsGroups;for(let Yn=0,Ii=mt.length;Yn<Ii;Yn++){let Yc=mt[Yn];ie.update(Yc,an),ie.bind(Yc,an)}}return an}function zf(S,B){S.ambientLightColor.needsUpdate=B,S.lightProbe.needsUpdate=B,S.sunLights.needsUpdate=B,S.sunLightShadows.needsUpdate=B,S.directionalLights.needsUpdate=B,S.directionalLightShadows.needsUpdate=B,S.pointLights.needsUpdate=B,S.pointLightShadows.needsUpdate=B,S.spotLights.needsUpdate=B,S.spotLightShadows.needsUpdate=B,S.rectAreaLights.needsUpdate=B,S.hemisphereLights.needsUpdate=B}function Vf(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return O},this.getActiveMipmapLevel=function(){return G},this.getRenderTarget=function(){return Q},this.setRenderTargetTextures=function(S,B,q){let H=X.get(S);H.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,H.__autoAllocateDepthBuffer===!1&&(H.__useRenderToTexture=!1),X.get(S.texture).__webglTexture=B,X.get(S.depthTexture).__webglTexture=H.__autoAllocateDepthBuffer?void 0:q,H.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,B){let q=X.get(S);q.__webglFramebuffer=B,q.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(S,B=0,q=0){Q=S,O=B,G=q;let H=null,W=!1,ve=!1;if(S){let _e=X.get(S);if(_e.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(N.FRAMEBUFFER,_e.__webglFramebuffer),j.copy(S.viewport),Ee.copy(S.scissor),ye=S.scissorTest,_.viewport(j),_.scissor(Ee),_.setScissorTest(ye),k=-1;return}else if(_e.__webglFramebuffer===void 0)J.setupRenderTarget(S);else if(_e.__hasExternalTextures)J.rebindTextures(S,X.get(S.texture).__webglTexture,X.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Ye=S.depthTexture;if(_e.__boundDepthTexture!==Ye){if(Ye!==null&&X.has(Ye)&&(S.width!==Ye.image.width||S.height!==Ye.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");J.setupDepthRenderbuffer(S)}}let Te=S.texture;(Te.isData3DTexture||Te.isDataArrayTexture||Te.isCompressedArrayTexture)&&(ve=!0);let Re=X.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Re[B])?H=Re[B][q]:H=Re[B],W=!0):S.samples>0&&J.useMultisampledRTT(S)===!1?H=X.get(S).__webglMultisampledFramebuffer:Array.isArray(Re)?H=Re[q]:H=Re,j.copy(S.viewport),Ee.copy(S.scissor),ye=S.scissorTest}else j.copy(be).multiplyScalar(te).floor(),Ee.copy(Ve).multiplyScalar(te).floor(),ye=lt;if(q!==0&&(H=L),_.bindFramebuffer(N.FRAMEBUFFER,H)&&_.drawBuffers(S,H),_.viewport(j),_.scissor(Ee),_.setScissorTest(ye),W){let _e=X.get(S.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+B,_e.__webglTexture,q)}else if(ve){let _e=B;for(let Te=0;Te<S.textures.length;Te++){let Re=X.get(S.textures[Te]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+Te,Re.__webglTexture,q,_e)}}else if(S!==null&&q!==0){let _e=X.get(S.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,_e.__webglTexture,q)}k=-1};function qc(S){let B=X.get(S);return(B.__readFormat!==S.format||B.__readType!==S.type)&&(B.__readFormat=S.format,B.__readType=S.type,B.__formatReadable=C.textureFormatReadable(S.format),B.__typeReadable=C.textureTypeReadable(S.type)),B}this.readRenderTargetPixels=function(S,B,q,H,W,ve,we,_e=0){if(!(S&&S.isWebGLRenderTarget)){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Te=X.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&we!==void 0&&(Te=Te[we]),Te){_.bindFramebuffer(N.FRAMEBUFFER,Te);try{let Re=S.textures[_e],Ye=Re.format,Ke=Re.type;S.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+_e);let Ae=qc(Re);if(Ae.__formatReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ae.__typeReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=S.width-H&&q>=0&&q<=S.height-W&&N.readPixels(B,q,H,W,pe.convert(Ye),pe.convert(Ke),ve)}finally{let Re=Q!==null?X.get(Q).__webglFramebuffer:null;_.bindFramebuffer(N.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(S,B,q,H,W,ve,we,_e=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Te=X.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&we!==void 0&&(Te=Te[we]),Te)if(B>=0&&B<=S.width-H&&q>=0&&q<=S.height-W){_.bindFramebuffer(N.FRAMEBUFFER,Te);let Re=S.textures[_e],Ye=Re.format,Ke=Re.type;S.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+_e);let Ae=qc(Re);if(Ae.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ae.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let at=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,at),N.bufferData(N.PIXEL_PACK_BUFFER,ve.byteLength,N.STREAM_READ),N.readPixels(B,q,H,W,pe.convert(Ye),pe.convert(Ke),0),N.bindBuffer(N.PIXEL_PACK_BUFFER,null);let St=Q!==null?X.get(Q).__webglFramebuffer:null;_.bindFramebuffer(N.FRAMEBUFFER,St);let gt=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await ou(N,gt,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,at),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,ve),N.bindBuffer(N.PIXEL_PACK_BUFFER,null),N.deleteBuffer(at),N.deleteSync(gt),ve}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,B=null,q=0){let H=Math.pow(2,-q),W=Math.floor(S.image.width*H),ve=Math.floor(S.image.height*H),we=B!==null?B.x:0,_e=B!==null?B.y:0;J.setTexture2D(S,0),N.copyTexSubImage2D(N.TEXTURE_2D,q,0,0,we,_e,W,ve),_.unbindTexture()},this.copyTextureToTexture=function(S,B,q=null,H=null,W=0,ve=0){let we,_e,Te,Re,Ye,Ke,Ae,at,St,gt=S.isCompressedTexture?S.mipmaps[ve]:S.image;if(q!==null)we=q.max.x-q.min.x,_e=q.max.y-q.min.y,Te=q.isBox3?q.max.z-q.min.z:1,Re=q.min.x,Ye=q.min.y,Ke=q.isBox3?q.min.z:0;else{let bt=Math.pow(2,-W);we=Math.floor(gt.width*bt),_e=Math.floor(gt.height*bt),S.isDataArrayTexture?Te=gt.depth:S.isData3DTexture?Te=Math.floor(gt.depth*bt):Te=1,Re=0,Ye=0,Ke=0}H!==null?(Ae=H.x,at=H.y,St=H.z):(Ae=0,at=0,St=0);let ft=pe.convert(B.format),Ot=pe.convert(B.type),Se;B.isData3DTexture?(J.setTexture3D(B,0),Se=N.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(J.setTexture2DArray(B,0),Se=N.TEXTURE_2D_ARRAY):(J.setTexture2D(B,0),Se=N.TEXTURE_2D),_.activeTexture(N.TEXTURE0),_.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,B.flipY),_.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),_.pixelStorei(N.UNPACK_ALIGNMENT,B.unpackAlignment);let Ht=_.getParameter(N.UNPACK_ROW_LENGTH),nt=_.getParameter(N.UNPACK_IMAGE_HEIGHT),an=_.getParameter(N.UNPACK_SKIP_PIXELS),Sn=_.getParameter(N.UNPACK_SKIP_ROWS),Xn=_.getParameter(N.UNPACK_SKIP_IMAGES);_.pixelStorei(N.UNPACK_ROW_LENGTH,gt.width),_.pixelStorei(N.UNPACK_IMAGE_HEIGHT,gt.height),_.pixelStorei(N.UNPACK_SKIP_PIXELS,Re),_.pixelStorei(N.UNPACK_SKIP_ROWS,Ye),_.pixelStorei(N.UNPACK_SKIP_IMAGES,Ke);let Ri=S.isDataArrayTexture||S.isData3DTexture,ht=B.isDataArrayTexture||B.isData3DTexture;if(S.isDepthTexture){let bt=X.get(S),qn=X.get(B),mt=X.get(bt.__renderTarget),Yn=X.get(qn.__renderTarget);_.bindFramebuffer(N.READ_FRAMEBUFFER,mt.__webglFramebuffer),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,Yn.__webglFramebuffer);for(let Ii=0;Ii<Te;Ii++)Ri&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,X.get(S).__webglTexture,W,Ke+Ii),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,X.get(B).__webglTexture,ve,St+Ii)),N.blitFramebuffer(Re,Ye,we,_e,Ae,at,we,_e,N.DEPTH_BUFFER_BIT,N.NEAREST);_.bindFramebuffer(N.READ_FRAMEBUFFER,null),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(W!==0||S.isRenderTargetTexture||X.has(S)){let bt=X.get(S),qn=X.get(B);_.bindFramebuffer(N.READ_FRAMEBUFFER,P),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,F);for(let mt=0;mt<Te;mt++)Ri?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,bt.__webglTexture,W,Ke+mt):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,bt.__webglTexture,W),ht?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,qn.__webglTexture,ve,St+mt):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,qn.__webglTexture,ve),W!==0?N.blitFramebuffer(Re,Ye,we,_e,Ae,at,we,_e,N.COLOR_BUFFER_BIT,N.NEAREST):ht?N.copyTexSubImage3D(Se,ve,Ae,at,St+mt,Re,Ye,we,_e):N.copyTexSubImage2D(Se,ve,Ae,at,Re,Ye,we,_e);_.bindFramebuffer(N.READ_FRAMEBUFFER,null),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else ht?S.isDataTexture||S.isData3DTexture?N.texSubImage3D(Se,ve,Ae,at,St,we,_e,Te,ft,Ot,gt.data):B.isCompressedArrayTexture?N.compressedTexSubImage3D(Se,ve,Ae,at,St,we,_e,Te,ft,gt.data):N.texSubImage3D(Se,ve,Ae,at,St,we,_e,Te,ft,Ot,gt):S.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,ve,Ae,at,we,_e,ft,Ot,gt.data):S.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,ve,Ae,at,gt.width,gt.height,ft,gt.data):N.texSubImage2D(N.TEXTURE_2D,ve,Ae,at,we,_e,ft,Ot,gt);_.pixelStorei(N.UNPACK_ROW_LENGTH,Ht),_.pixelStorei(N.UNPACK_IMAGE_HEIGHT,nt),_.pixelStorei(N.UNPACK_SKIP_PIXELS,an),_.pixelStorei(N.UNPACK_SKIP_ROWS,Sn),_.pixelStorei(N.UNPACK_SKIP_IMAGES,Xn),ve===0&&B.generateMipmaps&&N.generateMipmap(Se),_.unbindTexture()},this.initRenderTarget=function(S){X.get(S).__webglFramebuffer===void 0&&J.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?J.setTextureCube(S,0):S.isData3DTexture?J.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?J.setTexture2DArray(S,0):J.setTexture2D(S,0),_.unbindTexture()},this.resetState=function(){O=0,G=0,Q=null,_.reset(),Me.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return mn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=et._getDrawingBufferColorSpace(e),t.unpackColorSpace=et._getUnpackColorSpace()}};var qt={lin:s=>s,sortie:s=>1-Math.pow(1-s,3),entreeSortie:s=>s<.5?4*s*s*s:1-Math.pow(-2*s+2,3)/2,ressort:s=>1+2.9*Math.pow(s-1,3)+1.9*Math.pow(s-1,2),rebond:s=>s<.36363636363636365?7.5625*s*s:s<.7272727272727273?(s-=.5454545454545454,7.5625*s*s+.75):s<.9090909090909091?(s-=.8181818181818182,7.5625*s*s+.9375):(s-=.9545454545454546,7.5625*s*s+.984375)},Ro=class{constructor(e){this.l=[],this.reduit=e||(()=>!1)}ajouter(e){return e.t0=performance.now()+(e.delai||0),e.courbe=e.courbe||qt.sortie,this.reduit()&&!e.toujours?(e.f(1),e.fin&&e.fin(),e):(this.l.push(e),e)}actif(){return this.l.length>0}maj(e){let t=this.l;for(let n=t.length-1;n>=0;n--){let i=t[n];if(i.stop){t.splice(n,1);continue}if(e<i.t0)continue;let r=Math.min(1,(e-i.t0)/i.dur);i.f(i.courbe(r),r),r>=1&&(t.splice(n,1),i.fin&&i.fin())}return t.length>0}vider(){this.l.length=0}};function Mc(s,e=!1){let t=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},a={},o=s[0].morphTargetsRelative,l=new Et,c=0;for(let u=0;u<s.length;++u){let h=s[u],f=0;if(t!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let d in h.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;r[d]===void 0&&(r[d]=[]),r[d].push(h.attributes[d]),f++}if(f!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(o!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let d in h.morphAttributes){if(!i.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(h.morphAttributes[d])}if(e){let d;if(t)d=h.index.count;else if(h.attributes.position!==void 0)d=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,u),c+=d}}if(t){let u=0,h=[];for(let f=0;f<s.length;++f){let d=s[f].index;for(let g=0;g<d.count;++g)h.push(d.getX(g)+u);u+=s[f].attributes.position.count}l.setIndex(h)}for(let u in r){let h=Xu(r[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,h)}for(let u in a){let h=a[u][0].length;if(h!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let f=0;f<h;++f){let d=[];for(let x=0;x<a[u].length;++x)d.push(a[u][x][f]);let g=Xu(d);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(g)}}}return l}function Xu(s){let e,t,n,i=-1,r=0;for(let c=0;c<s.length;++c){let u=s[c];if(e===void 0&&(e=u.array.constructor),e!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=u.itemSize),t!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=u.gpuType),i!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*t}let a=new e(r),o=new Ut(a,t,n),l=0;for(let c=0;c<s.length;++c){let u=s[c];if(u.isInterleavedBufferAttribute){let h=l/t;for(let f=0,d=u.count;f<d;f++)for(let g=0;g<t;g++){let x=u.getComponent(f,g);o.setComponent(f+h,g,x)}}else a.set(u.array,l);l+=u.count*t}return i!==void 0&&(o.gpuType=i),o}var Xx=new tt,qu=new Nt,Yu=new Ft(0,0,0,"YXZ"),qx=new D,Yx=new D,Io=new Be,ut=(s,e,t)=>Math.min(t,Math.max(e,s)),kt=(s,e,t)=>s+(e-s)*t;function ui(s){let e=s*2654435761+1013904223>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function Ju(s,e,t,n){let i=new xn;if(Zu(i,s,e,t),n){let r=new xn;Zu(r,s-2*n,e-2*n,Math.max(.05,t-n)),i.holes.push(r)}return i}function Zu(s,e,t,n){let i=-e/2,r=-t/2;n=Math.min(n,e/2,t/2),s.moveTo(i+n,r),s.lineTo(i+e-n,r),s.quadraticCurveTo(i+e,r,i+e,r+n),s.lineTo(i+e,r+t-n),s.quadraticCurveTo(i+e,r+t,i+e-n,r+t),s.lineTo(i+n,r+t),s.quadraticCurveTo(i,r+t,i,r+t-n),s.lineTo(i,r+n),s.quadraticCurveTo(i,r,i+n,r)}var ct=class{constructor(){this.l=[]}g(e,t,n=0,i=0,r=0,a=0,o=0,l=0,c=1,u=1,h=1){Yu.set(a,o,l),qu.setFromEuler(Yu),e.applyMatrix4(Xx.compose(qx.set(n,i,r),qu,Yx.set(c,u,h))),e.index&&(e=e.toNonIndexed()),e.deleteAttribute("uv");let f=e.attributes.position.count,d=new Float32Array(f*3);Io.set(t);for(let g=0;g<f;g++)d[g*3]=Io.r,d[g*3+1]=Io.g,d[g*3+2]=Io.b;return e.setAttribute("color",new Ut(d,3)),this.l.push(e),this}boite(e,t,n,i,r,a,o,l=0,c=0,u=0){return this.g(new dt(e,t,n),o,i,r,a,u,l,c)}cyl(e,t,n,i,r,a,o,l=12,c=0,u=0,h=0){return this.g(new es(e,t,n,l),o,i,r,a,c,h,u)}cone(e,t,n,i,r,a,o=8){return this.g(new yi(e,t,o),a,n,i,r)}sphere(e,t,n,i,r,a=1,o=1,l=1,c=8){return this.g(new js(e,c,Math.max(4,c-2)),r,t,n,i,0,0,0,a,o,l)}profil(e,t,n,i,r,a,o=.1,l=0){let c=new xn;e.forEach((h,f)=>f?c.lineTo(h[0],h[1]):c.moveTo(h[0],h[1]));let u=new is(c,{depth:Math.max(.01,t-2*o),bevelEnabled:o>0,bevelThickness:o,bevelSize:o,bevelSegments:2,curveSegments:4});return u.translate(0,0,-t/2+o),this.g(u,a,n,i,r,0,l,0)}fin(){let e=this.l.length?Mc(this.l):null;return this.l.forEach(t=>t.dispose()),this.l=[],e}};function Nn(s,e,t,n,i,r,a){let o=new dt(s,e,t),l=o.attributes.uv,c=[t,t,s,s,s,s];for(let u=0;u<6;u++)for(let h=0;h<4;h++){let f=u*4+h;l.setXY(f,l.getX(f)*c[u]/a,l.getY(f)*(u===2||u===3?t:e)/4)}return o.translate(n,i,r),o}function gr(s,e,t,n,i){let r=new xn;s.forEach((u,h)=>h?r.lineTo(u[0],u[1]):r.moveTo(u[0],u[1])),(e||[]).forEach(u=>{let h=new xn;u.forEach((f,d)=>d?h.lineTo(f[0],f[1]):h.moveTo(f[0],f[1])),r.holes.push(h)});let a=new is(r,{depth:t,bevelEnabled:!1,curveSegments:1});a.translate(0,0,n);let o=a.attributes.position,l=a.attributes.normal,c=a.attributes.uv;for(let u=0;u<o.count;u++){let h=Math.abs(l.getX(u)),f=Math.abs(l.getZ(u));c.setXY(u,(f>.5?o.getX(u):h>.5?o.getZ(u):o.getX(u))/i,o.getY(u)/4)}return a}function Po(s,e,t){let n=new dt(s,.001,e),i=n.attributes.uv;for(let r=0;r<i.count;r++)i.setXY(r,i.getX(r)*s/t,i.getY(r)*e/t);return n}function Ai(s){let e=s.length?Mc(s):null;return s.forEach(t=>t.dispose()),e}function Ci(s,e,t,n,i,r,a,o){let l=new dt(s,e,t),c=l.attributes.uv,u=[t,t,s,s,s,s],h=[e,e,t,t,e,e];for(let f=0;f<6;f++)for(let d=0;d<4;d++){let g=f*4+d;c.setXY(g,c.getX(g)*u[f]/a,c.getY(g)*h[f]/o)}return l.translate(n,i,r),l}var ds=Math.PI/4,ps=35*Math.PI/180,bc=Math.PI/2,Lo=class{constructor(e,t){this.el=e,this.o=t,this.cam=new ai(-10,10,10,-10,1,900),this.e={x:0,z:0,az:ds,ech:12,ox:0,oy:0,el:ps},this.W=1,this.H=1,this.t=null,this.ptrs=new Map,this.mode=null,this.g=null,this.utilisee=!1,this.R=new D,this.U=new D,this.F=new D,this.liaison(),this.appliquer()}taille(e,t){this.W=Math.max(1,e),this.H=Math.max(1,t),this.appliquer()}appliquer(){let e=this.e,t=this.cam,n=Math.cos(e.el),i=Math.sin(e.el),r=Math.sin(e.az),a=Math.cos(e.az);this.R.set(a,0,-r),this.F.set(-r*n,-i,-a*n),this.U.crossVectors(this.R,this.F),t.left=-(this.W/2+e.ox)/e.ech,t.right=(this.W/2-e.ox)/e.ech,t.top=(this.H/2+e.oy)/e.ech,t.bottom=-(this.H/2-e.oy)/e.ech,t.position.set(e.x-this.F.x*300,-this.F.y*300,e.z-this.F.z*300),t.up.set(0,1,0),t.lookAt(e.x,0,e.z),t.updateProjectionMatrix(),t.updateMatrixWorld(!0)}sol(e,t,n){let i=this.e,r=(e-this.W/2-i.ox)/i.ech,a=-(t-this.H/2-i.oy)/i.ech,o=a/Math.sin(i.el),l=Math.sin(i.az),c=Math.cos(i.az);return(n||new D).set(i.x+c*r-l*o,0,i.z-l*r-c*o)}ecran(e,t){let n=this.e,i=e.x-n.x,r=e.y,a=e.z-n.z,o=i*this.R.x+r*this.R.y+a*this.R.z,l=i*this.U.x+r*this.U.y+a*this.U.z,c=i*this.F.x+r*this.F.y+a*this.F.z;return t=t||{},t.x=this.W/2+n.ox+o*n.ech,t.y=this.H/2+n.oy-l*n.ech,t.z=c,t}etendue(e,t,n){n=n===void 0?this.e.el:n;let i=Math.sin(t),r=Math.cos(t),a=Math.cos(n),o=Math.sin(n),l=1e9,c=-1e9,u=1e9,h=-1e9,f=0,d=0;return e.forEach(g=>{let x=g.x*r-g.z*i,p=(g.x*i+g.z*r)*-o+g.y*a;l=Math.min(l,x),c=Math.max(c,x),u=Math.min(u,p),h=Math.max(h,p)}),{u0:l,u1:c,v0:u,v1:h,w:c-l,h:h-u,cu:(l+c)/2,cv:(u+h)/2}}centre(e,t,n,i){i=i===void 0?this.e.el:i;let r=Math.sin(n),a=Math.cos(n),o=t/Math.sin(i);return{x:a*e-r*o,z:-r*e-a*o}}contraindre(){let e=this.o.limites&&this.o.limites(),t=this.e;e&&(t.ech=ut(t.ech,e.echMin,e.echMax),t.x=ut(t.x,e.x0,e.x1),t.z=ut(t.z,e.z0,e.z1))}changer(){this.contraindre(),this.appliquer(),this.o.surChange(),this.o.demander()}arreter(){this.t&&(this.t.stop=!0,this.t=null)}aller(e,t){this.arreter();let n=this.e,i={x:n.x,z:n.z,az:n.az,ech:n.ech,ox:n.ox,oy:n.oy,el:n.el},r={el:e.el!==void 0?e.el:i.el,x:e.x!==void 0?e.x:i.x,z:e.z!==void 0?e.z:i.z,az:e.az!==void 0?e.az:i.az,ech:e.ech!==void 0?e.ech:i.ech,ox:e.ox!==void 0?e.ox:i.ox,oy:e.oy!==void 0?e.oy:i.oy},a=this.o.limites&&this.o.limites();a&&(r.ech=ut(r.ech,a.echMin,a.echMax),r.x=ut(r.x,a.x0,a.x1),r.z=ut(r.z,a.z0,a.z1)),this.vers=r;let o=()=>{Object.assign(this.e,r),this.t=null,this.appliquer(),this.o.surChange()};if(this.o.anim.reduit()||!t){o(),this.o.demander();return}this.t=this.o.anim.ajouter({dur:t,courbe:qt.entreeSortie,toujours:!1,f:l=>{let c=this.e;c.el=i.el+(r.el-i.el)*l,c.x=i.x+(r.x-i.x)*l,c.z=i.z+(r.z-i.z)*l,c.az=i.az+(r.az-i.az)*l,c.ox=i.ox+(r.ox-i.ox)*l,c.oy=i.oy+(r.oy-i.oy)*l,c.ech=i.ech*Math.pow(r.ech/i.ech,l),this.appliquer(),this.o.surChange()},fin:o}),this.o.demander()}pivoter(e){this.versAzimut(this.cible("az")+e*bc,520)}versAzimut(e,t){let n=!this.utilisee&&this.o.cadreAzimut?this.o.cadreAzimut(e):null;this.aller(n||{az:e},n?650:t)}cible(e){return this.t&&this.vers?this.vers[e]:this.e[e]}zoom(e,t,n,i){let r=this.e,a=this.o.limites&&this.o.limites();if(t===void 0){this.aller({ech:ut(this.cible("ech")*e,a?a.echMin:1,a?a.echMax:200)},i===void 0?260:i);return}let o=ut(r.ech*e,a?a.echMin:1,a?a.echMax:200),l=this.sol(t,n);r.ech=o,this.appliquer();let c=this.sol(t,n);r.x+=l.x-c.x,r.z+=l.z-c.z,this.changer()}deplacer(e,t){let n=this.e;this.aller({x:n.x+e,z:n.z+t},200)}caler(){let e=this.e,t=ds+Math.round((e.az-ds)/bc)*bc;Math.abs(t-e.az)>.001&&this.versAzimut(t,260)}liaison(){let e=this.el,t=r=>{let a=e.getBoundingClientRect();return[r.clientX-a.left,r.clientY-a.top]};this.on=[];let n=(r,a,o,l)=>{r.addEventListener(a,o,l),this.on.push([r,a,o,l])};n(e,"contextmenu",r=>r.preventDefault()),n(e,"pointerdown",r=>{if(r.pointerType==="mouse"&&r.button>2)return;this.arreter();try{e.setPointerCapture(r.pointerId)}catch{}let[a,o]=t(r);if(this.ptrs.set(r.pointerId,{x:a,y:o}),this.ptrs.size===1)this.mode=r.pointerType==="mouse"&&r.button===2?"rot":"pan",this.depart={x:a,y:o,bouge:!1,bouton:r.button,az0:this.e.az},this.externe=this.mode==="pan"&&this.o.debutGlisse&&this.o.debutGlisse(a,o,r)||null;else if(this.ptrs.size===2){this.externe&&(this.externe.fin(a,o,"annule"),this.externe=null),this.mode="geste",this.depart.bouge=!0,this.utilisee=!0;let[l,c]=Array.from(this.ptrs.values());this.g={d:Math.hypot(l.x-c.x,l.y-c.y)||1,a:Math.atan2(c.y-l.y,c.x-l.x),mx:(l.x+c.x)/2,my:(l.y+c.y)/2}}e.focus({preventScroll:!0}),r.pointerType!=="mouse"&&r.preventDefault()}),n(e,"pointermove",r=>{let[a,o]=t(r),l=this.ptrs.get(r.pointerId);if(!l){r.pointerType==="mouse"&&this.o.surSurvol&&this.o.surSurvol(a,o);return}let c=a-l.x,u=o-l.y;l.x=a,l.y=o;let h=this.e;if(this.mode==="pan")!this.depart.bouge&&Math.hypot(a-this.depart.x,o-this.depart.y)>5&&(this.depart.bouge=!0,this.utilisee=!0,this.o.surSurvol&&this.o.surSurvol(-1,-1)),this.depart.bouge&&(this.externe?this.externe.move(a,o):this.pan(c,u));else if(this.mode==="rot")this.depart.bouge=!0,h.az+=c*.0075,this.changer();else if(this.mode==="geste"&&this.ptrs.size>=2){let[f,d]=Array.from(this.ptrs.values()),g=Math.hypot(f.x-d.x,f.y-d.y)||1,x=Math.atan2(d.y-f.y,d.x-f.x),p=(f.x+d.x)/2,m=(f.y+d.y)/2,M=this.o.limites&&this.o.limites(),E=this.g,y=this.sol(E.mx,E.my);h.ech=ut(h.ech*g/E.d,M?M.echMin:1,M?M.echMax:200);let b=x-E.a;b>Math.PI?b-=2*Math.PI:b<-Math.PI&&(b+=2*Math.PI),h.az+=b,this.appliquer();let w=this.sol(p,m);h.x+=y.x-w.x,h.z+=y.z-w.z,E.d=g,E.a=x,E.mx=p,E.my=m,this.changer()}});let i=r=>{if(!this.ptrs.has(r.pointerId))return;let[a,o]=t(r),l=this.depart;this.ptrs.delete(r.pointerId);try{e.releasePointerCapture(r.pointerId)}catch{}if(this.ptrs.size===0){let c=this.mode;if(this.mode=null,this.externe){let u=this.externe;this.externe=null;let h=r.type!=="pointerup"?"annule":l.bouge?"glisse":"clic";u.fin(a,o,h),h==="clic"&&l.bouton<=1&&this.o.surClic&&this.o.surClic(a,o,r);return}c==="pan"&&!l.bouge&&r.type==="pointerup"&&l.bouton<=1&&this.o.surClic?this.o.surClic(a,o,r):(c==="rot"||c==="geste")&&this.caler()}else if(this.ptrs.size===1){this.mode="pan";let c=Array.from(this.ptrs.values())[0];this.depart={x:c.x,y:c.y,bouge:!0,bouton:0,az0:this.e.az},this.caler()}};n(e,"pointerup",i),n(e,"pointercancel",i),n(e,"pointerleave",r=>{!this.ptrs.size&&this.o.surSurvol&&this.o.surSurvol(-1,-1)}),n(e,"wheel",r=>this.molette(r),{passive:!1}),n(e,"keydown",r=>{if(r.altKey||r.ctrlKey||r.metaKey)return;let a=this.e,o=(r.shiftKey?90:45)/a.ech,l=r.key,c=this.R,u=[-Math.sin(a.az),-Math.cos(a.az)],h=!0;l==="ArrowLeft"?this.deplacer(-c.x*o,-c.z*o):l==="ArrowRight"?this.deplacer(c.x*o,c.z*o):l==="ArrowUp"?this.deplacer(u[0]*o*1.4,u[1]*o*1.4):l==="ArrowDown"?this.deplacer(-u[0]*o*1.4,-u[1]*o*1.4):l==="+"||l==="="?this.zoom(1.35):l==="-"||l==="_"?this.zoom(1/1.35):l==="q"||l==="Q"?this.pivoter(-1):l==="e"||l==="E"?this.pivoter(1):l==="Home"||l==="0"?this.o.recentrer():h=!1,h&&(r.preventDefault(),l!=="q"&&l!=="Q"&&l!=="e"&&l!=="E"&&l!=="Home"&&l!=="0"&&(this.utilisee=!0))})}molette(e){e.preventDefault(),this.arreter(),this.utilisee=!0;let t=this.el.getBoundingClientRect(),n=e.deltaMode===1?16:e.deltaMode===2?300:1;this.zoom(Math.exp(-e.deltaY*n*(e.ctrlKey?.01:.0017)),e.clientX-t.left,e.clientY-t.top)}pan(e,t){let n=this.e,i=Math.sin(n.az),r=Math.cos(n.az),a=t/(n.ech*Math.sin(n.el));n.x-=r*e/n.ech,n.z+=i*e/n.ech,n.x+=-i*a,n.z+=-r*a,this.changer()}liberer(){this.arreter(),this.on.forEach(([e,t,n,i])=>e.removeEventListener(t,n,i)),this.on=[],this.ptrs.clear()}};var ms=224,gs=84,xr=9,Zx=48,xs='"Figtree", "Segoe UI", system-ui, sans-serif';function Sc(s,e,t,n,i,r){s.beginPath(),s.moveTo(e+r,t),s.arcTo(e+n,t,e+n,t+i,r),s.arcTo(e+n,t+i,e,t+i,r),s.arcTo(e,t+i,e,t,r),s.arcTo(e,t,e+n,t,r),s.closePath()}var Un={caisse(s,e,t,n){return(i,r,a)=>{Sc(i,3,3,r-6,a-6,12),i.fillStyle="#ffffff",i.fill(),i.lineWidth=3,i.strokeStyle=n?"#d92d2d":"#9aa7bd",i.stroke(),n&&(i.fillStyle="#d92d2d",Sc(i,3,3,18,a-6,9),i.fill()),i.textBaseline="middle",i.textAlign="left",i.fillStyle="#1d2531";let o=30;for(i.font="800 "+o+"px "+xs;i.measureText(s).width>r-36&&o>14;)o-=2,i.font="800 "+o+"px "+xs;i.fillText(s,n?28:14,a*.32),i.textAlign="right",i.fillStyle=n?"#b71c1c":"#0f5132",i.font="800 36px "+xs;let l=t&&t!=="unité"?" "+t:"",c=e+l;for(o=36;i.measureText(c).width>r-24&&o>16;)o-=2,i.font="800 "+o+"px "+xs;i.fillText(c,r-14,a*.7)}},repere(s,e,t,n){return(i,r,a)=>{n&&(i.translate((r-a)/2,0),r=a),Sc(i,3,3,r-6,a-6,16),i.fillStyle=e||"#1f5fbf",i.fill(),i.fillStyle=t||"#ffffff",i.textAlign="center",i.textBaseline="middle";let o=Math.round(a*.78);for(i.font="800 "+o+"px "+xs;i.measureText(s).width>r-20&&o>14;)o-=3,i.font="800 "+o+"px "+xs;i.fillText(s,r/2,a/2+3)}},plus(s){return Un.repere("+"+s,"#f28c28","#ffffff",!0)},zone(s){return Un.repere(s,"#f2c230","#2b2b2b",!1)},lettre(s,e){return Un.repere(s,e||"#1f5fbf","#ffffff",!0)}},_r=class{constructor(e){this.aniso=e,this.pages=[],this.n=0}ajouter(e){let t=this.pages[this.pages.length-1];(!t||t.n>=xr*Zx)&&(t=this.pages[this.pages.push({n:0,dess:[],quads:[]})-1]);let n=t.n++,i=n%xr,r=Math.floor(n/xr);return t.dess.push([e,i,r]),{page:this.pages.length-1,col:i,lig:r}}quad(e,t){this.pages[e.page].quads.push([e,t])}construire(e){this.meshes=[],this.pages.forEach(t=>{if(!t.quads.length)return;let n=Math.max(1,Math.ceil(t.n/xr)),i=document.createElement("canvas");i.width=ms*xr,i.height=gs*n;let r=i.getContext("2d");t.dess.forEach(([d,g,x])=>{r.save(),r.translate(g*ms,x*gs),r.beginPath(),r.rect(0,0,ms,gs),r.clip(),d(r,ms,gs),r.restore()});let a=new vi(i);a.colorSpace=Ct,a.anisotropy=this.aniso,a.minFilter=Pn,a.magFilter=Rt;let o=[],l=[],c=[];t.quads.forEach(([d,g],x)=>{let p=(d.col*ms+2)/i.width,m=((d.col+1)*ms-2)/i.width,M=i.height,E=1-(d.lig*gs+2)/M,y=1-((d.lig+1)*gs-2)/M;g.forEach(b=>o.push(b[0],b[1],b[2])),l.push(p,y,m,y,m,E,p,E),c.push(x*4,x*4+1,x*4+2,x*4,x*4+2,x*4+3)});let u=new Et;u.setAttribute("position",new it(o,3)),u.setAttribute("uv",new it(l,2)),u.setIndex(c);let h=new Tt({map:a,transparent:!0,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:!1}),f=new We(u,h);f.frustumCulled=!1,f.renderOrder=4,e.add(f),this.meshes.push(f)})}liberer(e){(this.meshes||[]).forEach(t=>{e.remove(t),t.geometry.dispose(),t.material.map.dispose(),t.material.dispose()}),this.meshes=[],this.pages=[]}};function vr(s,e,t,n,i,r){let a=Math.cos(r),o=Math.sin(r),l=n/2,c=i/2;return[[-l,-c],[l,-c],[l,c],[-l,c]].map(([u,h])=>[s+u*a,e+h,t-u*o])}var $u={bea:{cle:"bea",toit:281746,cadre:670323,lis:[3506218,2994897],acc:2994897,cabine:744104,bande:3506218,filet:2994897,auvent:["#044c92","#f4f8fc"],nom:"Beauchemin",c:["#044c92","#35802a"],halo:2994897,logo:{mode:"blanc",ratio:812/166}},bch:{cle:"bch",toit:13632027,cadre:10224918,lis:[13214285,15255417],acc:13214285,cabine:13632027,bande:13632027,filet:13214285,auvent:["#d6353d","#a1161e"],nom:"Boutique Chaleur",c:["#d0021b","#c9a24d"],halo:14723386,logo:{mode:"rouge",ratio:784/352}},neutre:{cle:"neutre",toit:5205916,cadre:3625082,lis:[9414342,12175582],acc:9414342,cabine:15659510,bande:7307678,filet:11122896,auvent:["#4f6f9c","#f4f6fa"],nom:"",c:["#4f6f9c","#8fa6c6"],halo:7113656}};function ju(s,e){let t=String(s||"").toLowerCase();return t==="bea"||t==="bch"?$u[t]:Object.assign({},$u.neutre,{cle:"neutre:"+t,nom:e||String(s||"")})}var Jx=11121867,$x=8227238,Qu=13620964,Do=2238259,Ku=8885163;var _t={x:.62,y:.46,z:.52},Yt={x:1.3,y:.16,z:1.1};function Mn(s,e,t,n,i,r,a=0){return{x:s,y:e,z:t,cols:n,rows:i,layers:r,ry:a}}function wc(s,e,t,n,i){let r=i&&i.bureau?i.bureau:0,a=s-r,o=ut(Math.round(a/5.2),1,9),l=a/o,c=ut(3.9+.1*a,4.4,6.4),u=ut(.3*l,1.1,2.2),h=c+u,f=Math.min(1.7,e*.42),d=Math.min(3.1,l-1.5),g=Math.min(3.5,c-.8),x=.18,p=.3,m=-s/2+r,M=e/2,E=new ct,y=[],b=[],w=new ct,A=[],v=[],T=[[m,0],[s/2,0],[s/2,c]];for(let F=o-1;F>=0;F--){let O=m+F*l;T.push([O,h]),F>0&&T.push([O,c])}let R=[];for(let F=0;F<o;F++){let O=m+(F+.5)*l;R.push([[O-d/2,x],[O-d/2,g],[O+d/2,g],[O+d/2,x]])}y.push(gr(T,null,e-f,-e/2,.5)),y.push(gr(T,R,f,M-f,.5));for(let F=0;F<o;F++){let O=m+(F+.5)*l;E.boite(d,(g-x)*.5,.03,O,x+(g-x)*.25,M-f+.02,Jx),E.boite(d,(g-x)*.5,.03,O,x+(g-x)*.75,M-f+.02,$x),E.boite(.34,g-x,.06,O-d/2+.25,x+(g-x)/2,M-f+.06,15331063),E.boite(d+.5,.2,.75,O,.1,M+.37,Qu),E.boite(p,g+p-x,.22,O-d/2-p/2,(x+g+p)/2,M+.04,t.cadre),E.boite(p,g+p-x,.22,O+d/2+p/2,(x+g+p)/2,M+.04,t.cadre),E.boite(d+2*p,p,.22,O,g+p/2,M+.04,t.cadre),E.boite(.62,.36,.07,O,g+p+.36,M+.04,t.cadre),E.boite(.4,.17,.02,O,g+p+.36,M+.09,16054267),E.cyl(.13,.13,.5,O-d/2+.2,.45,M+.62,Do,8),E.cyl(.13,.13,.5,O+d/2-.2,.45,M+.62,Do,8);let G=(n()-.5)*.5;A.push(Mn(O+G,x,M-f+.15+Yt.z/2,2,2,4,(n()-.5)*.08))}for(let F=0;F<o;F++){let O=m+(F+.5)*l;w.boite(1.7,.85,.05,O,c*.68,-e/2-.03,13035766),E.boite(1.9,.07,.1,O,c*.68+.5,-e/2-.03,t.cadre),E.boite(1.9,.07,.1,O,c*.68-.5,-e/2-.03,t.cadre),E.boite(.07,.99,.1,O-.93,c*.68,-e/2-.03,t.cadre),E.boite(.07,.99,.1,O+.93,c*.68,-e/2-.03,t.cadre)}E.boite(.36,h,.36,m,h/2,M,t.cadre),E.boite(.36,c,.36,s/2,c/2,M,t.cadre),E.boite(.36,c,.36,s/2,c/2,-e/2,t.cadre),E.boite(.36,h,.36,m,h/2,-e/2,t.cadre),E.boite(.1,2.15,1.15,s/2+.04,1.08,M-1.7,t.cadre),E.boite(.04,1.85,.85,s/2+.1,1,M-1.7,12963296),E.boite(.22,.12,1.4,s/2+.1,2.25,M-1.7,15922683),v.push({w:3.4,h:.85,x:s/2+.05,y:c*.6,z:-.2,ry:Math.PI/2});let I=Math.hypot(l,u),U=-Math.atan2(u,l),L=.16,P=.4;for(let F=0;F<o;F++){let O=m+F*l,G=O+l,Q=(O+G)/2,k=c+u/2,Z=u/I,j=l/I,Ee=L/2+.03,ye=new dt(I+.5,L,e+2*P),je=ye.attributes.uv;for(let Y=0;Y<je.count;Y++)je.setXY(Y,je.getX(Y),je.getY(Y)*(e+2*P)/.9);ye.rotateZ(U),ye.translate(Q+Z*Ee-.08*Math.cos(U),k+j*Ee+.08*Math.sin(U),0),b.push(ye);let qe=Q+Z*(Ee+L/2+0),Qe=k+j*(Ee+L/2);E.boite(I+.5,.1,.1,qe,Qe-.02,M+P+.04,t.lis[0],0,U),E.boite(I+.5,.07,.07,qe+Z*.07,Qe+j*.07-.02,M+P+.06,t.lis[1],0,U),E.boite(.3,.3,e+2*P+.1,G+.08,c+.02,0,t.cadre),E.boite(.26,.26,e+2*P+.1,O-.04,h+.05,0,t.cadre,0,U),w.boite(.08,u*.5,e*.8,O-.06,c+u*.52,0,13035766)}return{statique:E.fin(),murs:Ai(y),toit:Ai(b),verre:w.fin(),plaques:v,piles:A,h,ancre:[0,h+.4,0],boite:[s,h,e],pin:[0,h+.1,0],portes:o}}function ef(s,e,t,n){let a=ut(e*.5,2.6,4.2),o=e-a,l=-s/2,c=e/2,u=-e/2+o,h=new ct,f=[],d=new ct,g=[],x=[];f.push(Nn(s,4,o,0,4/2,-e/2+o/2,.5)),f.push(Nn(.25,4,a,l+.125,4/2,u+a/2,.5)),f.push(Nn(.25,4,a,-l-.125,4/2,u+a/2,.5)),f.push(Nn(s,.7,.3,0,4-.35,c-.15,.5)),h.boite(s+.5,.28,e+.5,0,4+.14,0,15856890),h.boite(s+.5,.22,.28,0,4+.39,c+.11,t.cadre),h.boite(.28,.22,e+.5,-l+.11,4+.39,0,t.cadre),h.boite(.28,.22,e+.5,l-.11,4+.39,0,t.cadre),h.boite(s-.3,.06,a-.2,0,.08,u+a/2,15129030);let p=Math.min(1.5,s*.18);h.boite(s,.18,.2,0,3.3+.09-0,c-.1,t.cadre),h.boite(s,.14,.2,0,.07,c-.1,t.cadre);let m=Math.max(2,Math.round(s/2.4));for(let E=0;E<=m;E++)h.boite(.12,3.3,.16,l+E/m*s,3.3/2,c-.1,t.cadre);h.boite(p+.3,3.3-.25,.22,0,(3.3-.25)/2+.08,c-.04,t.cadre),d.boite(s-.3,3.3-.3,.05,0,3.3/2+.02,c-.1,13233399),h.boite(p,3.3-.55,.1,0,(3.3-.55)/2+.1,c-0,14939387),h.boite(.07,.9,.12,-p/2+.18,1.3,c+.06,Ku),h.boite(.07,.9,.12,p/2-.18,1.3,c+.06,Ku),h.boite(p+1,.1,.9,0,.05,c+.45,Qu);for(let E=0;E<3;E++){let y=l+1.2+E*(s-2.4)/2;h.boite(1.8,1.9,.5,y,.95+.06,u+.3,13608303),h.boite(1.7,.05,.52,y,.9,u+.3,15258544),h.boite(1.7,.05,.52,y,1.45,u+.3,15258544)}for(let E=0;E<2;E++){let y=l+s*(.28+.42*E);h.boite(1.6,.7,1.2,y,4+.28+.35,-e/2+o*.45,14673391),h.cyl(.42,.42,.06,y,4+.28+.72,-e/2+o*.45,9345714,12)}d.boite(.06,1.3,1.6,-l+.02,2.2,-e/2+o*.5,13233399),h.boite(.1,1.45,.12,-l+.02,2.2,-e/2+o*.5-.84,t.cadre),h.boite(.1,1.45,.12,-l+.02,2.2,-e/2+o*.5+.84,t.cadre),x.push({w:Math.min(s-1,5.2),h:.6,x:0,y:4-.35,z:c+.02,ry:0});let M=1.15;return x.push({auvent:!0,w:s+.2,l:Math.hypot(M,.5),x:0,y:3.3+.3,z:c+M/2,rx:Math.atan2(.5,M)}),h.boite(s+.2,.12,.1,0,3.3-.12,c+M-.05,t.cadre),g.push(Mn(-s*.22,.1,u+a-1.25,2,2,3,.12),Mn(s*.2,.1,u+a-1.5,2,2,3,-.1)),{statique:h.fin(),murs:Ai(f),toit:null,verre:d.fin(),plaques:x,piles:g,h:4+.5,ancre:[0,4+.9,0],boite:[s,4+.5,e],pin:[0,4+.6,0],vitreTrans:!0}}function tf(s,e,t,n){let i=ut((s-.6)/6.9,.55,1.15),r=new ct,a=new ct,o=[],l=[],c=-3.3,u=-1.4,h=-1.3,f=3.2,d=2.3,g=d/2;r.boite(6.6,.3,1.6,-.05,.75,0,Do),[[-2.45,1],[-2.45,-1],[1.7,1],[1.7,-1],[2.35,1],[2.35,-1]].forEach(([A,v])=>{r.cyl(.52,.52,.36,A,.52,v*1.02,Do,14,Math.PI/2),r.cyl(.26,.26,.37,A,.52,v*1.03,12831708,10,Math.PI/2)}),r.boite(1.4,.3,.1,-2.45,1,1.15,3817810),r.boite(1.4,.3,.1,-2.45,1,-1.15,3817810);let x=[[-3.2,.7],[-3.2,1.55],[-2.95,2.05],[-2.5,2.45],[-1.5,2.45],[-1.5,.7]];r.profil(x,d-.2,0,0,0,t.cabine,.1),r.boite(.16,.34,d-.1,-3.34,.95,0,15265270),r.boite(.06,.16,.5,-3.33,1.4,.75,16774348),r.boite(.06,.16,.5,-3.33,1.4,-.75,16774348),r.boite(.06,.55,1.1,-3.3,1.2,0,2962501),a.g(new dt(.06,.62,d-.5),2437191,-2.745,2.27,0,0,0,-.844),[-1,1].forEach(A=>{a.boite(1.2,.72,.05,-2.2,1.88,A*(g-.07),2437191),r.boite(.12,.3,.1,-3,1.55,A*(g+.12),2962501)});let p=3.45,m=g-.02;r.boite(f-h,.14,d-.04,(h+f)/2,1,0,14936306),r.boite(f-h+.1,.16,d+.06,(h+f)/2,p+.08,0,16185596),[-1,1].forEach(A=>{r.boite(f-h,p-1,.1,(h+f)/2,(p+1)/2,A*m,16382974),r.boite(f-h-.1,.3,.025,(h+f)/2-.05,1.5,A*(m+.06),t.bande),r.boite(f-h-.1,.07,.025,(h+f)/2-.05,1.78,A*(m+.06),t.filet),r.boite(.2,p-1,.16,f-.1,(p+1)/2,A*(m-0),14278636),r.boite(1.05,2.35,.07,f-.6,2.15,A*(g+.1),16382974),r.boite(.12,.12,.12,f+.02,.98,A*.95,14100029)}),r.boite(.1,p-1,d-.04,h+.1,(p+1)/2,0,15199477),r.boite(.95,.1,d-.2,f+.5,.2,0,10135229),r.boite(.08,.12,d-.2,f+.99,.2,0,15906106),r.boite(.1,.5,d-.4,f+.02,.55,0,3160139);let M=t.logo?t.logo.ratio:4,E=t.cle==="bch"?1:t.logo?.66:.62,y=Math.min(t.cle==="bch"?2.2:3.2,E*M),b=t.cle==="bch"?2.35:2.5,w=t.cle==="bch"?.45:.35;return l.push({tex:"logo",w:y,h:E,x:w,y:b,z:m+.075,ry:0},{tex:"logo",w:y,h:E,x:w,y:b,z:-m-.075,ry:Math.PI}),o.push(Mn(f+.5,.25,0,2,2,3,.05),Mn(2.35,1.07,-.56,2,2,3,.03),Mn(2.35,1.07,.56,2,2,3,-.04)),{statique:r.fin(),murs:null,toit:null,verre:a.fin(),plaques:l,piles:o,h:p+.3,ancre:[0,p+.7,0],boite:[6.8,p+.2,d+.4],pin:[0,p+.4,0],echelle:i}}function Ec(){let s=new ct,e=.1;return s.boite(_t.x,_t.y,_t.z,0,0,0,14211288),s.boite(e,.012,_t.z+.012,0,_t.y/2,0,16777215),s.boite(e,_t.y+.012,.012,0,0,_t.z/2,16777215),s.boite(e,_t.y+.012,.012,0,0,-_t.z/2,16777215),s.boite(.16,.002+.01,.1,_t.x*.28,_t.y/2+.003,_t.z*.25,15790320),s.fin()}function Tc(){let s=new ct,e=12094040,t=10844234;for(let n=-1;n<=1;n++)s.boite(Yt.x,.07,.11,0,.035,n*.46,t);for(let n=0;n<7;n++)s.boite(.13,.04,Yt.z,-Yt.x/2+.08+n*((Yt.x-.16)/6),.09,0,e);return s.boite(Yt.x,.05,.12,0,.135,-.49,e),s.boite(Yt.x,.05,.12,0,.135,.49,e),s.fin()}var nf=["#d9a56e","#cf9a62","#e0b07a","#c58f5a"],Kx=new Be("#e7edf6"),jx=new tt,sf=new Nt,Qx=new D,e_=new D,rf=new Ft,af=new Be,No=class{constructor(e,t,n){this.scene=e,this.anim=t,this.surChange=n,this.mat=new At({vertexColors:!0}),this.geoC=Ec(),this.geoP=Tc(),this.cartons=null,this.palettes=null,this.c=[],this.p=[],this.occupe=!1}construire(e){let t=new Map;this.c.forEach(r=>t.set(r.cle,r)),this.p.forEach(r=>t.set(r.cle,r));let n=[],i=[];e.forEach(r=>{let a=ui(r.id*7919+13),o=r.e||1,l=0;r.piles.forEach((c,u)=>{let h=Math.cos(c.ry),f=Math.sin(c.ry),d=r.x+c.x*o,g=r.z+c.z*o,x=c.y*o,p=r.id+":p"+u,m={cle:p,bat:r.id,x:d,y:x,z:g,ry:c.ry,sc:o,ech:0,de:0,vers:0,t0:0,dur:1,actif:!1,cartons:[]},M=t.get(p);M&&(m.ech=m.vers=m.de=M.ech),i.push(m);let E=c.cols*c.rows;for(let y=0;y<E*c.layers;y++){let b=Math.floor(y/E),w=y%E,A=w%c.cols,v=Math.floor(w/c.cols),T=(A-(c.cols-1)/2)*(_t.x+.015)+(a()-.5)*.04,R=(v-(c.rows-1)/2)*(_t.z+.015)+(a()-.5)*.04,I=(Yt.y+(b+.5)*_t.y)*o,U=r.id+":c"+l,L={cle:U,bat:r.id,rang:l,pal:m,x:d+(T*h+R*f)*o,y:x+I,z:g+(-T*f+R*h)*o,ry:c.ry+(a()-.5)*.07,sc:o*(.97+a()*.06),ech:0,de:0,vers:0,t0:0,dur:1,actif:!1,teinte:new Be(nf[Math.floor(a()*nf.length)]).multiplyScalar(.94+a()*.1)},P=t.get(U);P&&(L.ech=L.vers=L.de=P.ech),m.cartons.push(L),n.push(L),l++}})}),this.c=n,this.p=i,this.reservation(n.length,i.length);for(let r=0;r<n.length;r++)this.ecrire(this.cartons,r,n[r]),this.cartons.setColorAt(r,n[r].teinte);for(let r=0;r<i.length;r++)this.ecrire(this.palettes,r,i[r]);this.cartons.instanceMatrix.needsUpdate=!0,this.palettes.instanceMatrix.needsUpdate=!0,this.cartons.instanceColor&&(this.cartons.instanceColor.needsUpdate=!0)}reservation(e,t){let n=(i,r,a)=>{if(i&&i.instanceMatrix.count>=a&&i.instanceMatrix.count<=a+32)return i.count=a,i;i&&(this.scene.remove(i),i.dispose());let o=new gn(r,this.mat,Math.max(1,a+16));return o.count=a,o.castShadow=!0,o.receiveShadow=!0,o.frustumCulled=!1,this.scene.add(o),o};this.cartons=n(this.cartons,this.geoC,e),this.palettes=n(this.palettes,this.geoP,t)}ecrire(e,t,n){let i=n.sc*Math.max(0,n.ech);rf.set(0,n.ry,0),sf.setFromEuler(rf),e.setMatrixAt(t,jx.compose(Qx.set(n.x,n.y,n.z),sf,e_.set(i,i,i)))}niveaux(e,t){t=t||{};let n=performance.now(),i=this.anim.reduit()||t.immediat,r={};this.c.forEach(a=>{let o=e[a.bat]||0,l=a.rang<o?1:0;if(l===a.vers)return;let c=(t.retards&&t.retards[a.bat]||0)+(l?(r[a.bat]=(r[a.bat]||0)+1)*22:0);this.demarrer(a,l,n,c,i)}),this.p.forEach(a=>{let o=a.cartons.some(l=>l.vers===1)?1:0;o!==a.vers&&this.demarrer(a,o,n,(t.retards&&t.retards[a.bat]||0)+(o?0:160),i)}),this.occupe=this.c.some(a=>a.actif)||this.p.some(a=>a.actif),this.flush(),this.occupe&&this.surChange(!0)}demarrer(e,t,n,i,r){if(e.de=e.ech,e.vers=t,r){e.ech=t,e.actif=!1,e.t0=0;return}e.t0=n+i,e.dur=t?340:220,e.actif=!0}flush(){for(let e=0;e<this.c.length;e++)this.ecrire(this.cartons,e,this.c[e]);for(let e=0;e<this.p.length;e++)this.ecrire(this.palettes,e,this.p[e]);this.cartons.instanceMatrix.needsUpdate=!0,this.palettes.instanceMatrix.needsUpdate=!0}maj(e){if(!this.occupe)return!1;let t=!1,n=!1,i=!1,r=(l,c,u,h)=>{if(!l.actif)return;if(e<l.t0){t=!0;return}let f=Math.min(1,(e-l.t0)/l.dur);l.ech=kt(l.de,l.vers,l.vers?qt.ressort(f):qt.sortie(f)),f>=1?(l.ech=l.vers,l.actif=!1):t=!0,this.ecrire(c,u,l),h.v=!0},a={v:!1},o={v:!1};for(let l=0;l<this.c.length;l++)r(this.c[l],this.cartons,l,a);for(let l=0;l<this.p.length;l++)r(this.p[l],this.palettes,l,o);return a.v&&(this.cartons.instanceMatrix.needsUpdate=!0),o.v&&(this.palettes.instanceMatrix.needsUpdate=!0),this.occupe=t,t}estomper(e,t){let n=!1;for(let i=0;i<this.c.length;i++){let r=this.c[i];r.bat===e&&(af.copy(r.teinte).lerp(Kx,t*.7),this.cartons.setColorAt(i,af),n=!0)}n&&this.cartons.instanceColor&&(this.cartons.instanceColor.needsUpdate=!0)}nombreVisible(e){let t=0;return this.c.forEach(n=>{n.bat===e&&n.vers===1&&t++}),t}liberer(){[this.cartons,this.palettes].forEach(e=>{e&&(this.scene.remove(e),e.dispose())}),this.geoC.dispose(),this.geoP.dispose(),this.mat.dispose(),this.cartons=this.palettes=null,this.c=[],this.p=[]}};var t_=16163898,n_=new tt,of=new Nt,lf=new Ft,i_=new D,s_=new D;function Cc(s,e,t,n){let i=Math.cos(n),r=Math.sin(n),a=(c,u)=>[e+c*i+u*r,t-c*r+u*i],o=(c,u,h,f,d,g,x)=>{let[p,m]=a(f,g);s.boite(c,u,h,p,d,m,x,n)},l=(c,u,h,f,d,g)=>{let[x,p]=a(h,d);s.cyl(c,c,u,x,f,p,g,12,Math.PI/2,0,n)};o(1.9,.5,1.1,0,.55,0,3106518),o(1.05,.85,1.14,-.45,1.1,0,16165151),o(.18,.5,.8,.12,1.55,0,16165151),o(.62,.12,.66,.25,1.2,0,2764861),o(.1,.55,.62,-.02,1.5,0,2764861),o(.3,.45,.46,.2,1.55,0,16742954);{let[c,u]=a(.2,0);s.sphere(.17,c,1.95,u,15779744,1,1,1,8)}[[.62,.52],[.62,-.52],[-.48,.52],[-.48,-.52]].forEach(([c,u])=>o(.06,1.2,.06,c,1.8,u,2369844)),o(1.18,.06,1.1,.07,2.4,0,2369844),o(.1,1.8,.08,.98,1.05,.34,4870499),o(.1,1.8,.08,.98,1.05,-.34,4870499),o(.1,.5,.95,1.04,.5,0,4870499),o(1,.07,.14,1.55,.12,.28,3883344),o(1,.07,.14,1.55,.12,-.28,3883344),l(.34,.26,.62,.34,.6,2304050),l(.34,.26,.62,.34,-.6,2304050),l(.27,.26,-.7,.27,.6,2304050),l(.27,.26,-.7,.27,-.6,2304050)}function r_(s,e,t){s.boite(2.4,.14,1.6,e,.07,t,8885163);for(let[n,i]of[[-1.15,-.75],[1.15,-.75],[-1.15,.75],[1.15,.75],[0,.75],[0,-.75]])s.boite(.07,1.6,.07,e+n,.9,t+i,4872824);for(let n of[.55,1.1,1.67])s.boite(2.4,.05,.05,e,n,t+.75,4872824),s.boite(2.4,.05,.05,e,n,t-.75,4872824),s.boite(.05,.05,1.5,e-1.15,n,t,4872824),s.boite(.05,.05,1.5,e+1.15,n,t,4872824);for(let n=0;n<4;n++)for(let i=0;i<2;i++){let r=e-.86+n*.58,a=t-.35+i*.7;s.cyl(.19,.19,.95,r,.14+.475,a,15988475,12),s.sphere(.19,r,1.09,a,15988475,1,.55,1,10),s.cyl(.2,.2,.07,r,.7,a,2994897,12),s.cyl(.1,.1,.12,r,1.24,a,2278336,10)}}function a_(s,e,t){[[4,0],[3,1],[2,2]].forEach(([o,l])=>{for(let c=0;c<o;c++){let u=e+(c-(o-1)/2)*1.1600000000000001,h=.56+l*(.56*1.74);s.cyl(.56,.56,3.6,u,h,t,15988217,16,Math.PI/2),s.sphere(.56,u,h,t-3.6/2,15988217,1,1,.42,10),s.sphere(.56,u,h,t+3.6/2,15988217,1,1,.42,10),s.cyl(.56+.01,.56+.01,.1,u,h,t-3.6*.28,13226462,16,Math.PI/2),s.cyl(.56+.01,.56+.01,.1,u,h,t+3.6*.28,13226462,16,Math.PI/2)}}),s.boite(4*(2*.56+.04)+.4,.12,3.6+.4,e,.06,t,11450052);let r=2*(2*.56+.04)+.9,a=3.6/2+.8;for(let o of[-1,1])for(let l=0;l<=5;l++)s.boite(.07,2,.07,e+o*r,1,t-a+l*(2*a/5),3752271);for(let o=1;o<5;o++)s.boite(.07,2,.07,e-r+o*(2*r/5),1,t+a,3752271);for(let o of[.25,1,1.95])s.boite(.05,.05,2*a,e-r,o,t,3752271),s.boite(.05,.05,2*a,e+r,o,t,3752271),s.boite(2*r,.05,.05,e,o,t+a,3752271);s.boite(.04,1.6,2*a,e+r,1.1,t,5661306),s.boite(2*r,1.6,.04,e,1.1,t+a,5661306)}function Uo(s,e,t){s.boite(.55,.05,.55,e,.025,t,15228700),s.cone(.24,.72,e,.41,t,16742954,10),s.cyl(.15,.2,.14,e,.4,t,16777215,10)}function cf(s,e,t,n){let i=.85+n()*.5,r=7323530+Math.floor(n()*3)*330245;s.cyl(.16*i,.24*i,1.5*i,e,.75*i,t,10188118,7),s.sphere(1.25*i,e,2.5*i,t,r,1,1.05,1,8),s.sphere(.85*i,e+.25*i,3.5*i,t-.15*i,r+660490,1,1,1,7)}function hf(s,e,t,n,i){let r=Math.max(2,Math.round(n/1.1)),a=Math.cos(i),o=Math.sin(i);for(let l=0;l<r;l++){let c=(l/(r-1)-.5)*(n-1);s.sphere(.66,e+c*a,.52,t-c*o,l%2?8832923:9752999,1,.82,1,7)}}function uf(s,e,t,n){s.boite(Yt.x,Yt.y,Yt.z,e,Yt.y/2,t,3104720);for(let i=0;i<2;i++)for(let r=0;r<2;r++)for(let a=0;a<2;a++){let o=e+(r-.5)*(_t.x+.015),l=t+(a-.5)*(_t.z+.015),c=Yt.y+(i+.5)*_t.y;s.boite(_t.x,_t.y,_t.z,o,c,l,15659512-Math.floor(n()*3)*328965),s.boite(.1,_t.y+.012,_t.z+.012,o,c,l,13489122)}}function o_(s,e,t,n,i,r){let a=new ct,o=ui(s.length*97+Math.round(e.x1-e.x0)*31+Math.round(e.z1-e.z0)),l=(d,g,x)=>s.every(p=>d+x<p.cx-p.w/2-.8||d-x>p.cx+p.w/2+.8||g+x<p.cz-p.d/2-.8||g-x>p.cz+p.d/2+.8);for(let d=t+2.2;d<n-1.5;d+=6.5+o()*2.5)cf(a,d,i+1.8+o()*1.2,o);for(let d=i+6;d<r-3;d+=7+o()*3)cf(a,t+1.8+o()*1.2,d,o);for(let d=t+4;d<n-6;d+=9+o()*3)hf(a,d,r-1.3,3.6+o()*2,0);for(let d=i+6;d<r-6;d+=9+o()*4)hf(a,n-1.3,d,3.6+o()*2,Math.PI/2);let c=e.x1+2.6,u=e.z0+3.2;l(c,u,1.6)&&(Cc(a,c,u,Math.PI),uf(a,c-3.1,u+1.4,o),uf(a,c-1.9,u+3.4,o),Uo(a,c+.6,u+2.3),Uo(a,c+1.5,u+2.9),Uo(a,c+2.4,u+3.5));let h=s.filter(d=>d.type==="entrepot"&&d.m.cle==="bea").sort((d,g)=>d.cz-g.cz||d.cx-g.cx)[0];if(h){let d={x0:h.cx-h.w/2,x1:h.cx+h.w/2,z0:h.cz-h.d/2,z1:h.cz+h.d/2},g=[[d.x1+2.4,d.z1-1.7],[d.x0+2.2,d.z1+2.1],[d.x0-2.4,d.z1-1.7],[h.cx,d.z0-2]].map(([x,p])=>({x,z:p})).find(x=>l(x.x,x.z,1.3));g&&(r_(a,g.x,g.z),Uo(a,g.x+1.8,g.z+.9))}let f=s.filter(d=>d.m.cle==="bea").sort((d,g)=>g.cx+g.cz-(d.cx+d.cz));for(let d of f){let g={x1:d.cx+d.w/2,z1:d.cz+d.d/2},x=[[g.x1+4.2,d.cz],[d.cx,g.z1+4.2]].map(([p,m])=>({x:p,z:m})).find(p=>l(p.x,p.z,3.2)&&p.x+3.2<n&&p.z+3.2<r);if(x){a_(a,x.x,x.z);break}}return a.fin()}function Ac(s,e,t,n,i,r){let a=n-e,o=i-t,l=Math.hypot(a,o),c=Math.atan2(a,o)-Math.PI/2;if(r){s.push([(e+n)/2,(t+i)/2,l+.14,c]);return}let u=1.15,h=.85,f=Math.max(1,Math.round((l+h)/(u+h))),d=(l+h)/f;for(let g=0;g<f;g++){let x=(g*d+(d-h)/2)/l;s.push([e+a*x,t+o*x,d-h,c])}}function ff(s,e){let t=new Mt,n=[],i=(L,P,F={})=>{let O=new We(L,P);return O.receiveShadow=F.recoit!==!1,O.castShadow=!!F.projette,t.add(O),n.push(L,P),O},r=1/0,a=-1/0,o=1/0,l=-1/0;s.forEach(L=>{r=Math.min(r,L.cx-L.w/2),a=Math.max(a,L.cx+L.w/2),o=Math.min(o,L.cz-L.d/2),l=Math.max(l,L.cz+L.d/2)}),s.length||(r=-10,a=10,o=-8,l=8);let c={x0:r,x1:a,z0:o,z1:l},u=6.5,h=36,f=26,d=r-u,g=a+u,x=o-u,p=l+u;if(g-d<h){let L=(h-(g-d))/2;d-=L,g+=L}if(p-x<f){let L=(f-(p-x))/2;x-=L,p+=L}let m=g-d,M=p-x,E=(d+g)/2,y=(x+p)/2,b=Math.max(m,M)+500;i(new dt(b,1,b),new At({color:13951221}),{recoit:!0}).position.set(E,-.5-.5,y),i(new dt(m,.5,M),new At({color:13226980})).position.set(E,-.25,y),i(Po(m,M,6),new At({color:15593976,map:e.dalles})).position.set(E,.001,y);let A=new ct,v=[];s.forEach(L=>{let P=L.type==="cube";if(A.boite(L.w-.4,.05,L.d-.4,L.cx,.027,L.cz,P?13885687:16054011),P){let O=L.w/2-.5,G=L.d/2-.5;[[-O,-G,O,-G],[O,-G,O,G],[O,G,-O,G],[-O,G,-O,-G]].forEach(Q=>Ac(v,L.cx+Q[0],L.cz+Q[1],L.cx+Q[2],L.cz+Q[3],!0))}else{let F=L.w/2-.35,O=L.d/2-.35;[[-F,-O,F,-O],[F,-O,F,O],[F,O,-F,O],[-F,O,-F,-O]].forEach(G=>Ac(v,L.cx+G[0],L.cz+G[1],L.cx+G[2],L.cz+G[3],!1))}});let T=A.fin();T&&i(T,new At({vertexColors:!0}));let R=[];Ac(R,d+2,p-2.6,g-2,p-2.6,!1);let I=(L,P,F)=>{if(!L.length)return;let O=new gn(new dt(1,.012,1),new At({color:P}),L.length);L.forEach((G,Q)=>{lf.set(0,G[3],0),of.setFromEuler(lf),O.setMatrixAt(Q,n_.compose(i_.set(G[0],.062,G[1]),of,s_.set(G[2],1,F)))}),O.receiveShadow=!0,O.frustumCulled=!1,t.add(O),n.push(O.geometry,O.material,O)};I(v,t_,.15),I(R,16777215,.17);let U=o_(s,c,d,g,x,p);if(U){let L=i(U,new At({vertexColors:!0}),{projette:!0})}return{groupe:t,bornes:c,cour:{x0:d,x1:g,z0:x,z1:p},liberer(){n.forEach(L=>{(L.isInstancedMesh||L.dispose)&&L.dispose()})}}}function yr(s,e,t,n,i,r){return s.boite(n,r,i,e,r/2,t,15789801),s.boite(n+.1,.07,i+.1,e,r+.03,t,16777215),s.boite(n+.04,.1,i+.04,e,.05,t,3093566),r+.07}function Rc(s,e,t,n,i,r){for(let a=0;a<i;a++)s.push({x:e+(a-(i-1)/2)*r*.8,y:t,z:n,r:r*(.55+a%2*.2),h:r*(1.5+a%3*.35),c:a%2?16765002:16753183,ph:a*1.7})}function l_(s,e,t,n,i){s.boite(1.7,1.15,.5,t,i+.58,n,1974568),s.boite(1.34,.78,.06,t,i+.6,n+.25,790034);for(let[r,a,o,l]of[[0,.99,1.5,.045],[0,.21,1.5,.045],[-.73,.6,.045,.82],[.73,.6,.045,.82]])s.boite(o,l,.03,t+r,i+a,n+.27,14278116);for(let r=0;r<4;r++)s.cyl(.07,.07,.5-r*.04,t-.4+r*.27,i+.3,n+.16,4863014,6,0,Math.PI/2+r%2*.2);Rc(e,t,i+.36,n+.2,5,.1)}function c_(s,e,t,n,i){s.boite(.95,.78,.7,t,i+.55,n,1974568),s.boite(1.05,.07,.8,t,i+.97,n,2764343);for(let r of[-1,1])for(let a of[-1,1])s.boite(.08,.2,.08,t+r*.4,i+.1,n+a*.28,1974568);s.boite(.52,.42,.03,t,i+.58,n+.36,16747050),s.boite(.6,.5,.025,t,i+.58,n+.345,3817290),s.boite(.1,.55,.05,t+.34,i+.6,n+.37,7831436),s.cyl(.1,.1,2.6,t,i+2.3,n-.1,2764343,12),s.cyl(.14,.14,.1,t,i+3.55,n-.1,7831436,12),s.cyl(.14,.14,.08,t,i+1.1,n-.1,7831436,12),Rc(e,t,i+.5,n+.34,3,.07)}function h_(s,e,t,n,i){s.boite(2.3,.18,.8,t,i+.09,n,10722704);for(let r of[-1,1])for(let a=0;a<5;a++)s.boite(.46,.28,.55,t+r*.86,i+.32+a*.28,n,a%2?12170150:10722704);s.boite(2.4,.2,.7,t,i+1.85,n+.05,9067062),s.boite(1.6,1.2,.5,t,i+2.55,n-.05,12170150),s.boite(1.2,.9,.45,t,i+3.5,n-.1,10722704),s.boite(1.28,1.3,.4,t,i+.9,n-.12,1382172);for(let r=0;r<3;r++)s.cyl(.09,.09,.8,t-.3+r*.3,i+.3,n+.02,5913382,7,0,Math.PI/2);Rc(e,t,i+.5,n+.02,6,.12)}function u_(s,e,t,n){s.cyl(.18,.3,.7,e-.6,n+.35,t,12999226,10),s.sphere(.2,e-.6,n+.82,t,12999226,1,.8,1,8),s.cyl(.2,.15,.4,e+.1,n+.2,t+.3,15262420,10);for(let i=0;i<6;i++)s.sphere(.2,e+.1+Math.cos(i*1.05)*.18,n+.62+i%2*.2,t+.3+Math.sin(i*1.05)*.18,4164178,1,1.2,1,6);s.boite(.9,.5,.6,e+.75,n+.25,t-.1,9067062);for(let i=0;i<5;i++)s.cyl(.09,.09,.8,e+.75,n+.5+i%2*.12,t-.35+i*.14,6964006,7,Math.PI/2,0,0);for(let i=0;i<3;i++)s.cyl(.05,.05,.22+i*.08,e-.2+i*.16,n+.11+i*.04,t-.4,16051414,8)}function f_(s,e,t,n){s.boite(.7,1,.55,e-.9,n+.5,t,15131871),s.boite(.4,.32,.03,e-.9,n+.6,t+.29,2106412),s.boite(.5,.1,.4,e-.9,n+1.04,t,2764343),s.cyl(.38,.28,.5,e+.5,n+.55,t,11740718,14),s.cyl(.4,.4,.06,e+.5,n+.82,t,2303533,14);for(let i of[0,2.1,4.2])s.boite(.06,.3,.06,e+.5+Math.cos(i)*.24,n+.15,t+Math.sin(i)*.24,2303533)}function df(s,e,t,n,i){let r=[],a=t-e,o=n+1.7,l=i-1.5;s.boite(a,.05,i-n,(e+t)/2,.025,(n+i)/2,14272424);for(let g=0;g<10;g++)s.boite(a,.052,.03,(e+t)/2,.026,n+(g+.5)*(i-n)/10,13482388);let c=yr(s,e+a*.17,o,2.7,1.9,.3);l_(s,r,e+a*.17,o-.2,c);let u=yr(s,e+a*.43,o,2.2,1.9,.3);c_(s,r,e+a*.43,o,u);let h=yr(s,e+a*.7,o,3,1.9,.3);h_(s,r,e+a*.7,o-.1,h);let f=yr(s,e+a*.92,o,2.2,1.9,.3);u_(s,e+a*.92-.2,o,f);let d=yr(s,e+a*.4,l,3.2,1.6,.18);return f_(s,e+a*.4,l,d),r}var d_=3107839;function Ic(){let t=Math.asin(.31794871794871793),n=Math.PI/2-t,i=[new oe(.001,0)];for(let r=0;r<=14;r++){let a=n+(Math.PI-n)*r/14;i.push(new oe(Math.max(.001,.62*Math.sin(a)),1.95-.62*Math.cos(a)))}return new $s(i,20)}var Fo=class{constructor(e,t,n,i){this.scene=e,this.anim=t,this.demander=n,this.ombres=i,this.geos=new Map,this.groupe=new Mt,e.add(this.groupe),this.pins=new Map,this.cadre=null,this.survol=null,this.geoGoutte=Ic(),this.geoDisque=new Gs(.27,20),this.matPin=new At({color:d_,emissive:731786,emissiveIntensity:.55}),this.matDisque=new Tt({color:16777215,side:ln}),this.carton=null,this.camAz=.78,this.echelleEcran=1,this.nPulses=0,this.nVols=0}anneauGeo(e,t,n){let i=e.toFixed(1)+"x"+t.toFixed(1)+":"+n;if(!this.geos.has(i)){let r=new Ks(Ju(e,t,1.3,n),8);r.rotateX(-Math.PI/2),this.geos.set(i,r)}return this.geos.get(i)}pulse(e,t,n){this.nPulses++;let i=this.anneauGeo(e.tw+.6,e.td+.6,.5),r=new Tt({color:t,transparent:!0,opacity:.9,depthWrite:!1}),a=new We(i,r);a.position.set(e.cx,.1,e.cz),a.renderOrder=3,this.groupe.add(a);let o=()=>{this.groupe.remove(a),r.dispose(),this.demander()};if(n){r.opacity=.7,this.anim.ajouter({dur:2200,toujours:!0,f:()=>{},fin:o});return}this.anim.ajouter({dur:1700,courbe:qt.sortie,f:l=>{let c=2.4*l;a.scale.set((e.tw+.6+2*c)/(e.tw+.6),1,(e.td+.6+2*c)/(e.td+.6)),r.opacity=.9*(1-l)},fin:o}),this.demander()}selection(e,t){if(this.cadre&&(this.groupe.remove(this.cadre.o),this.cadre.m.dispose(),this.cadre.m2.dispose(),this.cadre.blanc.material.dispose(),this.cadre=null),!e)return;let n=new Tt({color:t,transparent:!0,opacity:.95,depthWrite:!1}),i=new Tt({color:t,transparent:!0,opacity:.16,depthWrite:!1}),r=new Mt,a=new We(this.anneauGeo(e.tw+.9,e.td+.9,.42),n);a.position.y=.11;let o=new We(this.anneauGeo(e.tw+.9,e.td+.9,0),i);o.position.y=.09;let l=new We(this.anneauGeo(e.tw+.2,e.td+.2,.14),new Tt({color:16777215,transparent:!0,opacity:.9,depthWrite:!1}));l.position.y=.12,r.add(o,a,l),r.position.set(e.cx,0,e.cz),r.renderOrder=2,this.groupe.add(r),this.cadre={o:r,m:n,m2:i,blanc:l}}survoler(e,t){if(this.survol&&(this.groupe.remove(this.survol.o),this.survol.m.dispose(),this.survol=null),!e)return;let n=new Tt({color:t,transparent:!0,opacity:.55,depthWrite:!1}),i=new We(this.anneauGeo(e.tw+.9,e.td+.9,.3),n);i.position.set(e.cx,.1,e.cz),i.renderOrder=2,this.groupe.add(i),this.survol={o:i,m:n}}epingle(e,t,n){this.retirerEpingle(e.id);let i=new Mt,r=new We(this.geoGoutte,this.matPin),a=new We(this.geoDisque,this.matDisque);r.castShadow=!0,a.position.set(0,2,.62),i.add(r,a);let o=e.pinY,l=e.pinEchelle;i.position.set(e.cx+e.pin[0],o+9,e.cz+e.pin[2]),this.groupe.add(i);let c={g:i,goutte:r,disque:a,base:o,k0:l,x:e.cx+e.pin[0],z:e.cz+e.pin[2],mort:!1};this.pins.set(e.id,c),this.orienter(c);let u=o+9;return n?(i.position.y=o,this.demander(),c):(i.visible=!1,this.anim.ajouter({dur:900,delai:120+t*130,courbe:qt.rebond,f:h=>{i.visible=!0,i.position.y=kt(u,o,h),this.ombres()},fin:()=>{i.position.y=o,this.ombres()}}),this.demander(),c)}retirerEpingle(e){let t=this.pins.get(e);t&&(this.pins.delete(e),t.mort=!0,this.groupe.remove(t.g))}effacerEpingles(){Array.from(this.pins.keys()).forEach(e=>this.retirerEpingle(e))}orienter(e,t,n){t!==void 0&&(this.camAz=t),n!==void 0&&(this.echelleEcran=n);let i=e.k0*Math.max(1,64/(3*e.k0*this.echelleEcran));e.g.scale.setScalar(Math.min(i,e.k0*3.8)),e.g.rotation.y=this.camAz}orienterTout(e,t){this.pins.forEach(n=>this.orienter(n,e,t))}voler(e,t,n,i){if(i){n&&n();return}if(this.nVols++,!this.carton){let c=Ec();this.carton={g:c,m:new At({vertexColors:!0,color:14725242})}}let r=new We(this.carton.g,this.carton.m);r.castShadow=!0,r.scale.setScalar(2.3),this.groupe.add(r);let a=new D(e.x,e.y,e.z),o=new D(t.x,t.y,t.z),l=5+a.distanceTo(o)*.18;this.anim.ajouter({dur:1e3,courbe:qt.entreeSortie,f:c=>{r.position.lerpVectors(a,o,c),r.position.y+=Math.sin(Math.PI*c)*l,r.rotation.set(c*5,c*3,c*2),this.ombres()},fin:()=>{this.groupe.remove(r),this.ombres(),n&&n(),this.demander()}}),this.demander()}liberer(){this.groupe.traverse(e=>{e.material&&e.material.dispose&&e.material!==this.matPin&&e.material!==this.matDisque&&e.material.dispose()}),this.scene.remove(this.groupe),this.geos.forEach(e=>e.dispose()),this.geos.clear(),this.geoGoutte.dispose(),this.geoDisque.dispose(),this.matPin.dispose(),this.matDisque.dispose(),this.carton&&(this.carton.g.dispose(),this.carton.m.dispose())}};function Fn(s,e){let t=document.createElement("canvas");return t.width=s,t.height=e,[t,t.getContext("2d")]}function On(s,e,t){let n=new vi(s);return n.colorSpace=Ct,n.wrapS=e?_i:tn,n.wrapT=e==="xy"?_i:tn,n.anisotropy=t||1,n}function pf(s){let[e,t]=Fn(64,128),n=t.createLinearGradient(0,128,0,0);n.addColorStop(0,"#d3daea"),n.addColorStop(.35,"#e8edf6"),n.addColorStop(1,"#f6f8fc"),t.fillStyle=n,t.fillRect(0,0,64,128);let i=t.createLinearGradient(0,0,64,0);return i.addColorStop(0,"rgba(120,135,170,0)"),i.addColorStop(.18,"rgba(120,135,170,.34)"),i.addColorStop(.42,"rgba(120,135,170,0)"),i.addColorStop(.7,"rgba(255,255,255,.55)"),i.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=i,t.fillRect(0,0,64,128),On(e,"x",s)}function mf(s){let[e,t]=Fn(8,64),n=t.createLinearGradient(0,0,0,64);return n.addColorStop(0,"rgba(255,255,255,.20)"),n.addColorStop(.12,"rgba(255,255,255,0)"),n.addColorStop(.86,"rgba(0,0,40,0)"),n.addColorStop(1,"rgba(0,0,40,.32)"),t.fillStyle="#ffffff",t.fillRect(0,0,8,64),t.fillStyle=n,t.fillRect(0,0,8,64),On(e,"xy",s)}function gf(s){let[e,t]=Fn(256,256);t.fillStyle="#ffffff",t.fillRect(0,0,256,256);for(let n=0;n<900;n++)t.fillStyle="rgba("+(150+n*7%60)+","+(165+n*13%50)+",200,.045)",t.fillRect(n*97%256,n*53%256,2+n%4,2+n%3);return t.fillStyle="rgba(120,138,176,.30)",t.fillRect(0,0,256,2),t.fillRect(0,0,2,256),t.fillStyle="rgba(255,255,255,.65)",t.fillRect(0,2,256,2),t.fillRect(2,0,2,256),On(e,"xy",s)}function xf(s,e,t,n,i){let[o,l]=Fn(512,128),c=(g,x,p,m,M)=>{l.beginPath(),l.moveTo(g+M,x),l.arcTo(g+p,x,g+p,x+m,M),l.arcTo(g+p,x+m,g,x+m,M),l.arcTo(g,x+m,g,x,M),l.arcTo(g,x,g+p,x,M),l.closePath()};c(4,4,504,120,22),l.fillStyle=n?e:"#ffffff",l.fill(),n||(c(4,98,504,26,14),l.fillStyle=e,l.fill(),l.fillStyle=t,l.fillRect(4,96,504,5));let u=62,h=58;l.fillStyle=n?"#ffffff":e,l.beginPath(),l.moveTo(u,h-30),l.lineTo(u+26,h-15),l.lineTo(u+26,h+15),l.lineTo(u,h+30),l.lineTo(u-26,h+15),l.lineTo(u-26,h-15),l.closePath(),l.fill(),l.fillStyle=n?e:t,l.beginPath(),l.moveTo(u,h),l.lineTo(u+26,h-15),l.lineTo(u+26,h+15),l.lineTo(u,h+30),l.closePath(),l.fill(),l.fillStyle=n?"#ffffff":e,l.font='700 50px "Figtree", "Segoe UI", system-ui, sans-serif',l.textBaseline="middle";let f=s,d=50;for(;l.measureText(f).width>362&&d>22;)d-=2,l.font="700 "+d+'px "Figtree", "Segoe UI", system-ui, sans-serif';return l.fillText(f,108,n?64:52),On(o,!1,i)}function _f(s,e,t,n){let[i,r]=Fn(64,8),a=n||1,o=64/(2*a);for(let c=0;c<a;c++)r.fillStyle=s,r.fillRect(c*2*o,0,o,8),r.fillStyle=e,r.fillRect(c*2*o+o,0,o,8);return On(i,"x",t)}function vf(s,e,t,n,i,r){s.beginPath(),s.moveTo(e+r,t),s.arcTo(e+n,t,e+n,t+i,r),s.arcTo(e+n,t+i,e,t+i,r),s.arcTo(e,t+i,e,t,r),s.arcTo(e,t,e+n,t,r),s.closePath()}function yf(s,e,t,n,i,r){let o=Math.max(64,Math.round(1024/s)),[l,c]=Fn(1024,o),u=On(l,!1,r);u.minFilter=1008;let h=()=>{vf(c,4,4,1016,o-8,Math.min(40,o/5))},f=()=>{c.clearRect(0,0,1024,o),h(),c.fillStyle=i==="rouge"?t:"#ffffff",c.fill(),c.fillStyle=i==="rouge"?"#ffffff":t,c.textBaseline="middle",c.textAlign="center";let d=Math.round(o*.42);for(c.font="800 "+d+'px "Figtree", "Segoe UI", system-ui, sans-serif';c.measureText(e).width>1024*.86&&d>18;)d-=3,c.font="800 "+d+'px "Figtree", "Segoe UI", system-ui, sans-serif';c.fillText(e,1024/2,o/2),i!=="rouge"&&(c.fillStyle=n,c.fillRect(1024*.1,o-22,1024*.8,6))};return f(),{tex:u,canvas:l,dessiner(d){if(!d){f(),u.needsUpdate=!0;return}if(c.clearRect(0,0,1024,o),i==="rouge")c.save(),h(),c.clip(),c.drawImage(d,0,0,1024,o),c.restore(),h(),c.lineWidth=7,c.strokeStyle="#ffffff",c.stroke();else{h(),c.fillStyle="#ffffff",c.fill();let g=o*.1,x=Math.min((1024-2*g)/d.width,(o-2*g)/d.height),p=d.width*x,m=d.height*x;c.drawImage(d,(1024-p)/2,(o-m)/2,p,m),h(),c.lineWidth=5,c.strokeStyle="rgba(120,135,170,.35)",c.stroke()}u.needsUpdate=!0}}}function Mf(s,e){let n=Math.round(1024/s),[i,r]=Fn(1024,n),a=On(i,!1,e);a.minFilter=1008;let o=()=>{r.clearRect(0,0,1024,n),r.textAlign="center",r.textBaseline="middle",r.fillStyle="#d4202c",r.font="900 "+Math.round(n*.34)+'px "Figtree", system-ui, sans-serif',r.fillText("Boutique",1024/2,n*.52),r.fillText("Chaleur",1024/2,n*.84),r.beginPath(),r.moveTo(1024*.5,n*.04),r.bezierCurveTo(1024*.62,n*.2,1024*.6,n*.3,1024*.5,n*.34),r.bezierCurveTo(1024*.4,n*.3,1024*.38,n*.2,1024*.5,n*.04),r.fillStyle="#ff7a2a",r.fill()};return o(),{tex:a,canvas:i,dessiner(l){if(!l){o(),a.needsUpdate=!0;return}let c=l.width*.035,u=l.height*.2,h=l.width*.66,f=l.height*.78,d=document.createElement("canvas");d.width=1024,d.height=n;let g=d.getContext("2d",{willReadFrequently:!0});g.drawImage(l,c,u,h,f,0,0,1024,n);try{let x=g.getImageData(0,0,1024,n),p=x.data;for(let m=0;m<p.length;m+=4){let M=Math.min(p[m],p[m+1],p[m+2]),E=Math.max(0,Math.min(1,(M-120)/100)),y=m/4/1024/n;p[m]=214,p[m+1]=y<.36?110:26,p[m+2]=y<.36?30:36,p[m+3]=Math.round(E*255)}r.clearRect(0,0,1024,n),r.putImageData(x,0,0)}catch{o()}a.needsUpdate=!0}}}function Pc(s,e,t,n){let[i,r]=Fn(128,128);r.fillStyle=t,r.fillRect(0,0,128,128);for(let a=0;a<8;a++)for(let o=-1;o<4;o++){let l=o*32+(a%2?16:0),c=a*16;r.fillStyle=(a*7+o*3)%5===0?e:s,r.fillRect(l+1.5,c+1.5,29,13),r.fillStyle="rgba(255,255,255,.10)",r.fillRect(l+1.5,c+1.5,29,3)}return On(i,"xy",n)}function bf(s){let[n,i]=Fn(1024,384),r=i.createLinearGradient(0,0,0,384);r.addColorStop(0,"#e9f3f8"),r.addColorStop(1,"#cfdde8"),["Poêles","Foyers","Décorations"].forEach((o,l)=>{let c=8+l*341.3333333333333;i.fillStyle=r,i.fillRect(c,6,1024/3-16,372),i.fillStyle="rgba(255,255,255,.55)",i.beginPath(),i.moveTo(c+20,6),i.lineTo(c+120,6),i.lineTo(c+50,378),i.lineTo(c+6,378),i.fill(),i.fillStyle="#d4202c",i.textAlign="center",i.textBaseline="middle";let u=74;for(i.font="800 "+u+'px "Figtree", system-ui, sans-serif';i.measureText(o).width>1024/3-70&&u>30;)u-=3,i.font="800 "+u+'px "Figtree", system-ui, sans-serif';i.fillText(o,c+(1024/3-16)/2,384*.2),i.fillStyle="#ff9a3c",i.beginPath(),i.moveTo(c+(1024/3-16)/2,384*.52),i.bezierCurveTo(c+1024/3*.66,384*.7,c+1024/3*.6,384*.85,c+(1024/3-16)/2,384*.9),i.bezierCurveTo(c+1024/3*.3,384*.85,c+1024/3*.36,384*.7,c+(1024/3-16)/2,384*.52),i.fill()});let a=On(n,!1,s);return a.minFilter=1008,a}function Sf(s){let[n,i]=Fn(1024,160);vf(i,4,4,1016,152,30),i.fillStyle="#c8202c",i.fill(),i.fillStyle="#ffffff",i.textAlign="center",i.textBaseline="middle",i.font='800 66px "Figtree", system-ui, sans-serif',i.fillText("Poêles · Foyers · Décorations",1024/2,160/2+4);let r=On(n,!1,s);return r.minFilter=1008,r}var Ef={entrepot:{bw:2.2,rd:.95,lh:.95,gap:2.3,yb:.12,mont:.1,lisse:.09},boutique:{bw:1.9,rd:.8,lh:.9,gap:2,yb:.12,mont:.09,lisse:.08},cube:{bw:1.4,rd:.55,lh:.74,gap:.95,yb:.1,mont:.06,lisse:.05}},zo={entrepot:{allees:4,etageres:6,niveaux:4},boutique:{allees:2,etageres:4,niveaux:3},cube:{allees:2,etageres:3,niveaux:3}},p_=2056127,m_=15895592,Tf=15909424,g_=new Be("#e4eaf3"),x_=new Be("#ffffff"),Af=["#d9a56e","#cf9a62","#e0b07a","#c58f5a"],Cf=["#3a73c9","#3f9a5a","#e48a2e","#8e99ab"],Oo=new tt,Lc=new Nt,Dc=new D,Nc=new D,bb=new Ft,_s=new Be,__=new en(new D(0,1,0),-1.6),v_=(s,e,t)=>s+":"+e+":"+t;function y_(s,e,t){let n=Ef[s]||Ef.entrepot,i=e||zo[s]||zo.entrepot,r=i.allees,a=i.etageres,o=i.niveaux,l=Object.assign({type:s,A:r,S:a,N:o,rowW:a*n.bw,rows:[]},n);l.Hr=o*n.lh+n.yb+.12;let c=ut(t,1,6),u=Math.ceil(Math.max(1,t)/c);if(s==="cube"){l.W=l.rowW+.5+2.1,l.D=2*n.rd+n.gap+.5,l.H=o*n.lh+.35,l.x0=-l.W/2+.3;for(let E=0;E<r;E++)l.rows.push({allee:E+1,z:(E===0?1:-1)*(n.gap/2+n.rd/2),x0:l.x0});let M=l.x0+l.rowW+.15;return l.zone={x:(M+l.W/2)/2,z:0,w:l.W/2-M-.1,d:l.D-.5,cols:2,pas:.6},l.bornes={x0:-l.W/2-2.2,x1:l.W/2+1,z0:-l.D/2-.6,z1:l.D/2+.9,h:l.H},l}let h=Math.max(3.2,c*1+.8),f=Math.max(2.4,u*1.05+.9),d=n.rd+n.gap,g=s==="boutique"?7.4:0;l.W=l.rowW+3.8;let x=1.1+(r-1)*d+n.rd+1.9+f+.5;l.D=x+(g?g+.4:0),l.sd=g,l.rs=d;let p=l.D/2-(g?g+.4:0);l.x0=-l.rowW/2-.2;let m=p-.25-f-1.9-n.rd/2;for(let M=0;M<r;M++)l.rows.push({allee:M+1,z:m-M*d,x0:l.x0});return l.zone={x:l.W/2-1.3-h/2,z:p-.25-f/2,w:h,d:f,cols:c,pas:1},l.zStore=p,l.H=o*n.lh+1.5,l.bornes={x0:-l.W/2,x1:l.W/2,z0:-l.D/2,z1:l.D/2,h:l.H},l}function Bo(s){let e=s*2654435761>>>0;return e^=e>>>15,(e>>>0)/4294967296}var Mr=class{constructor(e,t,n,i){this.sc=e,this.b=t,this.o=i||{},this.type=t.type,this.m=t.m,this.jet=[],this.murs=[],this.flammes=[],this.suivis=new Set,this.peutRanger=!!(n&&n.peut_ranger)&&this.o.peutRanger!==!1,this.geo=n&&n.geometrie||zo[t.type]||zo.entrepot,this.lignes=(n&&n.lignes||[]).map(r=>Object.assign({},r)),this.sigLignes=JSON.stringify(this.lignes.map(r=>[r.piece_id,r.code,r.quantite,r.unite,!!r.bas,r.rangement?[r.rangement.allee,r.rangement.etagere,r.rangement.niveau]:null])),this.g=new Mt,this.g.name="interieur",this.R=ui(t.id*17+3),this.crates=new Map,this.idx=[],this.survolId=null,this.focusId=null,this.cible=null,this.pin=null,this.drag=null,this.celluleSurvol=null,this.flammeJusqua=0,this.atlas=new _r(e.aniso),this.L=y_(this.type,this.geo,this.lignes.filter(r=>!this.placee(r)).length),this.bornes=this.L.bornes,this.construire(),e.scene.add(this.g)}placee(e){let t=e.rangement;return!!(t&&t.allee>=1&&t.allee<=this.geo.allees&&t.etagere>=1&&t.etagere<=this.geo.etageres&&t.niveau>=1&&t.niveau<=this.geo.niveaux)}mat(e){let t=new At(e);return this.jet.push(t),t}suivre(e){return this.jet.push(e),e}construire(){let e=this.L,t=this.sc,n=new ct,i=this.type;if(this.unit=this.suivre(new dt(1,1,1)),i==="cube"){n.boite(e.W+.2,.14,e.D+.3,0,-.07,0,12897497),n.boite(e.W+.2,.2,.2,0,-.3,e.D/2-.3,3160139),n.boite(e.W+.2,.2,.2,0,-.3,-e.D/2+.3,3160139);for(let[o,l]of[[-e.W/2+1.2,1],[-e.W/2+1.2,-1],[e.W/2-2.4,1],[e.W/2-1.7,1],[e.W/2-2.4,-1],[e.W/2-1.7,-1]])n.cyl(.52,.52,.36,o,-.28,l*(e.D/2+.15),2238259,14,Math.PI/2),n.cyl(.26,.26,.37,o,-.28,l*(e.D/2+.16),12831708,10,Math.PI/2);n.boite(1.9,1.5,e.D,-e.W/2-.95,.75,0,this.m.cabine),n.boite(.1,.5,e.D-.3,-e.W/2-1.95,1.1,0,2962501),n.boite(1.1,.12,e.D-.2,e.W/2+.55,-.05,0,10135229),n.boite(.08,.14,e.D-.2,e.W/2+1.1,-.05,0,15906106)}else n.boite(e.W+.6,.4,e.D+.6,0,-.2,0,13226980);let r=new We(this.suivre(Po(e.W,e.D,5)),this.mat({color:i==="cube"?13489634:15331062,map:i==="cube"?null:t.tex.dalles}));r.position.set(0,.002,0),r.receiveShadow=!0,this.g.add(r),this.murs=[],this.fenetres=[],this.construireMurs(n),this.construireRayons(n),this.construireZone(n),this.construireAccessoires(n),i==="boutique"&&(this.flammesDef=df(n,-e.W/2+.7,e.W/2-.7,e.zStore+.7,e.D/2-.5),this.construireShowroomExtra(n));let a=n.fin();if(a){let o=new We(this.suivre(a),this.mat({vertexColors:!0}));o.castShadow=!0,o.receiveShadow=!0,this.g.add(o)}this.flammesDef&&this.flammesDef.length&&this.construireFlammes(),this.reconstruire(!0)}construireMurs(e){let t=this.L,n=this.sc,i=t.H,r=this.type;if(r==="cube"){let c=new Mt,u=(x,p,m,M,E,y,b)=>{let w=new ct;return w.boite(x,p,m,M,E,y,b),w},h=new ct,f=new ct,d=new ct;h.boite(t.W+.2,i,.12,0,i/2,-t.D/2-.06,16054010),h.boite(t.W+.2,.3,.14,0,.9,-t.D/2-.07,this.m.bande),f.boite(.12,i,t.D+.2,-t.W/2-.06,i/2,0,15330803),d.boite(t.W+.2,.5,.12,0,.25,t.D/2+.06,16054010),[[h,0,-1],[f,-1,0]].forEach(([x,p,m])=>{let M=new Mt,E=x.fin(),y=new We(this.suivre(E),this.mat({vertexColors:!0}));y.castShadow=!0,y.receiveShadow=!0,M.add(y),this.g.add(M),this.murs.push({g:M,nx:p,nz:m})});let g=new We(this.suivre(d.fin()),this.mat({vertexColors:!0}));g.castShadow=!0,g.receiveShadow=!0,this.g.add(g);return}let a=r==="boutique"?15853532:15923199,o=this.mat(r==="boutique"?{color:a,emissive:2762272}:{map:n.tex.murs,color:a,emissive:2633791});[[0,-1,t.W+.6,0,-t.D/2-.15,!0],[0,1,t.W+.6,0,t.D/2+.15,!0],[-1,0,t.D,-t.W/2-.15,0,!1],[1,0,t.D,t.W/2+.15,0,!1]].forEach(([c,u,h,f,d,g])=>{let x=new Mt,p=.5,m=this.suivre(g?Nn(h,i,.3,f,i/2,d,p):Nn(.3,i,h,f,i/2,d,p)),M=new We(m,o);M.castShadow=!0,M.receiveShadow=!0,x.add(M);let E=new ct,y=g?Math.max(1,Math.floor(t.W/4.2)):Math.max(1,Math.floor(t.D/4.2));for(let v=0;v<y;v++){let T=(v+.5)/y-.5;r==="boutique"&&c===-1&&Math.abs(T*t.D*.9-(t.zStore+t.D/2)/2)<4.1||(g?(E.boite(2.3,1.2,.05,T*t.W*.9,i*.66,d-u*.16,12575729),E.boite(2.5,.08,.08,T*t.W*.9,i*.66+.64,d-u*.16,15659768),E.boite(2.5,.08,.08,T*t.W*.9,i*.66-.64,d-u*.16,15659768)):(E.boite(.05,1.2,2.3,f-c*.16,i*.66,T*t.D*.9,12575729),E.boite(.08,.08,2.5,f-c*.16,i*.66+.64,T*t.D*.9,15659768),E.boite(.08,.08,2.5,f-c*.16,i*.66-.64,T*t.D*.9,15659768)))}if(r==="boutique"&&c===-1){let v=Sf(n.aniso);this.jet.push(v);let T=new We(this.suivre(new Rn(5.6,5.6*160/1024)),new Tt({map:v,transparent:!0,toneMapped:!1}));this.jet.push(T.material),T.position.set(f+.16,3.35,(t.zStore+t.D/2)/2),T.rotation.y=Math.PI/2,x.add(T)}let b=E.fin();if(b){let v=new We(this.suivre(b),this.mat({vertexColors:!0,emissive:2767442,emissiveIntensity:.35}));x.add(v)}this.g.add(x),this.murs.push({g:x,nx:c,nz:u});let w=this.suivre(g?new dt(h,.45,.3):new dt(.3,.45,h)),A=new We(w,o);A.position.set(f,.225,d),A.receiveShadow=!0,A.castShadow=!0,this.g.add(A)})}construireRayons(e){let t=this.L,n=[],i=[],r=[],a=this.type==="cube"?12634582:12174289;t.rows.forEach(l=>{let c=l.z+t.rd/2,u=l.z-t.rd/2,h=l.x0;for(let f=0;f<=t.S;f++)for(let d of[c-.05,u+.05])n.push([h+f*t.bw,t.Hr/2,d,t.mont,t.Hr,t.mont]);for(let f=0;f<=t.N;f++){let d=t.yb+f*t.lh;for(let g=0;g<t.S;g++)for(let x of[c-.05,u+.05])i.push([h+(g+.5)*t.bw,d,x,t.bw-t.mont,t.lisse,.06])}for(let f=0;f<t.N;f++)for(let d=0;d<t.S;d++)r.push([h+(d+.5)*t.bw,t.yb+f*t.lh+.06,l.z,t.bw-.12,.04,t.rd-.1])});let o=(l,c)=>{if(!l.length)return;let u=new gn(this.unit,this.mat({color:c}),l.length);l.forEach((h,f)=>u.setMatrixAt(f,Oo.compose(Dc.set(h[0],h[1],h[2]),Lc.identity(),Nc.set(h[3],h[4],h[5])))),u.castShadow=!0,u.receiveShadow=!0,u.frustumCulled=!1,this.g.add(u)};o(n,this.type==="cube"?4882390:p_),o(i,m_),o(r,a)}construireZone(e){let t=this.L,n=t.zone,i=(a,o,l,c)=>e.boite(a,.014,o,l,.012,c,Tf);i(n.w,.12,n.x,n.z-n.d/2),i(n.w,.12,n.x,n.z+n.d/2),i(.12,n.d,n.x-n.w/2,n.z),i(.12,n.d,n.x+n.w/2,n.z);for(let a=0;a<Math.floor(n.w/.8);a++)e.boite(.1,.012,n.d-.3,n.x-n.w/2+.5+a*.8,.011,n.z,16179338,.6);let r=this.type==="cube"?.26:.36;e.cyl(.04,.04,1,n.x+n.w/2-.05,.5,n.z-n.d/2+.05,4871528,6),this.type!=="cube"&&t.rows.forEach(a=>{for(let o of[t.rd/2+.36])e.boite(t.rowW+.8,.014,.1,a.x0+t.rowW/2,.012,a.z+o,Tf)})}construireAccessoires(e){let t=this.L,n=this.type;if(n==="cube"){e.boite(.1,.6,.1,-t.W/2+.2,.3,t.D/2-.35,13840175);return}let i=t.rows[0];for(let r of t.rows)for(let a of[-1,1])e.cyl(.11,.11,.8,r.x0+t.rowW+.7,.4,r.z+a*(t.rd/2+.1),15909424,10),e.cyl(.115,.115,.12,r.x0+t.rowW+.7,.55,r.z+a*(t.rd/2+.1),2238259,10);e.cyl(.1,.1,.55,-t.W/2+.45,1.1,-t.D/2+.5,13840175,10),e.boite(.24,.24,.05,-t.W/2+.45,1.6,-t.D/2+.32,16053492),n!=="boutique"&&Cc(e,-t.W/2+3.2,i.z+t.rd/2+1.1,Math.PI*.9);for(let r=0;r<3;r++)e.boite(1.2,.1,1,-t.W/2+1,.05+r*.1,t.zStore-1.6,10844234);if(n==="boutique"){let r=t.zStore+.2;e.boite(t.W*.38,1.05,.14,-t.W/2+t.W*.19,.525,r,15262422),e.boite(t.W*.38,1.05,.14,t.W/2-t.W*.19,.525,r,15262422),e.boite(2.8,1.05,.9,t.W*.2,.525,t.zStore-1,13115436),e.boite(3,.07,1,t.W*.2,1.08,t.zStore-1,15987180),e.boite(.5,.35,.4,t.W*.2+.7,1.28,t.zStore-1,2764343),e.boite(.4,.28,.02,t.W*.2+.7,1.32,t.zStore-.78,7327976)}}construireShowroomExtra(e){}construireFlammes(){let e=this.suivre(new yi(1,1,7)),t=new Tt({color:16753183,toneMapped:!1}),n=new Tt({color:16765002,toneMapped:!1});this.jet.push(t,n),this.flammesDef.forEach(i=>{let r=new We(e,i.c===16765002?n:t);r.position.set(i.x,i.y+i.h/2,i.z),r.scale.set(i.r,i.h,i.r),r.userData={f:i,y:i.y+i.h/2},this.g.add(r),this.flammes.push(r)})}animer(e){return!this.flammes.length||e>this.flammeJusqua?!1:(this.flammes.forEach(t=>{let n=t.userData.f,i=e*.012+n.ph;t.scale.set(n.r*(1+.12*Math.sin(i*1.3)),n.h*(1+.22*Math.sin(i)+.1*Math.sin(i*2.7)),n.r*(1+.1*Math.cos(i*1.7))),t.position.y=n.y+t.scale.y/2,t.rotation.z=.08*Math.sin(i*.8)}),!0)}eveiller(e){this.flammeJusqua=performance.now()+(e||5e3),this.sc.demander()}orienter(e){let t=Math.sin(e),n=Math.cos(e);this.murs.forEach(i=>{i.g.visible=i.nx*t+i.nz*n<.05})}dimensions(e,t){let n=this.L,i=ut(Math.log10(1+e)/2.7,0,1),r=this.type==="cube"?.8:1,a=Math.min(kt(.66,1.3,i)*r,t),o=Math.min(kt(.42,.68,i)*r,n.lh-.22),l=Math.min(kt(.48,.8,i)*r,n.rd-.12);return{w:a,h:o,d:l,deux:e>=150&&n.lh-.24>=2*.3*r}}cellule(e,t,n){let i=this.L,r=i.rows[e-1];return r?{x:r.x0+(t-.5)*i.bw,y0:i.yb+(n-1)*i.lh,z:r.z,row:r}:null}planifier(){let e=this.L,t=new Map,n=[],i=new Map,r=(c,u)=>c.code<u.code?-1:c.code>u.code?1:c.piece_id-u.piece_id;this.lignes.slice().sort(r).forEach(c=>{if(this.placee(c)){let u=v_(c.rangement.allee,c.rangement.etagere,c.rangement.niveau);t.has(u)||t.set(u,[]),t.get(u).push(c)}else n.push(c)}),this.plus=[],t.forEach((c,u)=>{let[h,f,d]=u.split(":").map(Number),g=this.cellule(h,f,d),x=c.slice(0,3),p=x.length;if(!g)return;let m=(e.bw-.2)/p;x.forEach((M,E)=>{let y=this.dimensions(parseFloat(M.quantite)||0,m-.06),b=g.x+(E-(p-1)/2)*m,w=g.y0+.085,A=g.z+e.rd/2-y.d/2-.1,v=y.deux?[{x:b,y:w+y.h*.32,z:A,sx:y.w,sy:y.h*.64,sz:y.d},{x:b,y:w+y.h*.64+y.h*.24,z:A,sx:y.w*.86,sy:y.h*.48,sz:y.d*.86}]:[{x:b,y:w+y.h/2,z:A,sx:y.w,sy:y.h,sz:y.d}];i.set(M.piece_id,{l:M,a:h,e:f,n:d,parts:v,plaque:!0,w:y.w,x:b,z:A,ytop:v[v.length-1].y+v[v.length-1].sy/2})}),c.slice(3).forEach(M=>{i.set(M.piece_id,{l:M,a:h,e:f,n:d,parts:[],cachee:!0})}),c.length>3&&this.plus.push({a:h,e:f,n:d,k:c.length-3,c:g})});let a=e.zone,o=a.cols,l=a.pas;return n.forEach((c,u)=>{let h=u%o,f=Math.floor(u/o),d=this.dimensions(parseFloat(c.quantite)||0,.85),g=a.x-(Math.min(o,n.length)-1)/2*l+h*l,x=a.z-(Math.ceil(n.length/o)-1)/2*.95+f*.95,p=this.type==="cube"?.02:.17,m=Math.max(d.h,.3);i.set(c.piece_id,{l:c,zone:!0,parts:[{x:g,y:p+m/2,z:x,sx:Math.max(d.w,.42),sy:m,sz:Math.max(d.d,.42)}],plaque:!0,w:d.w,x:g,z:x,ytop:p+m,palette:!0})}),i}reconstruire(e){let t=this.planifier(),n=performance.now(),i=!e&&!this.sc.reduit(),r=[];return this.crates.forEach((a,o)=>{!t.has(o)&&!a.mort&&(a.mort=!0,this.demarrer(a,null,n,i))}),t.forEach((a,o)=>{let l=this.crates.get(o);if(!l){l={id:o,l:a.l,parts:[],de:[],vers:[],ech:e?1:0,ech0:0,ech1:1,t0:n,dur:1,actif:!1,couleur:this.couleurDe(o),mort:!1},this.crates.set(o,l),l.vers=a.parts,l.de=a.parts.map(h=>Object.assign({},h)),l.t=a,e?l.parts=a.parts.map(h=>Object.assign({},h)):this.demarrer(l,a,n,i,!0);return}let c=parseFloat(l.l.quantite)||0,u=parseFloat(a.l.quantite)||0;Math.abs(u-c)>1e-9&&!e&&(r.push({id:o,delta:Math.round((u-c)*1e3)/1e3}),l.pulse=n),l.l=a.l,l.mort=!1,this.demarrer(l,a,n,i)}),this.crates.forEach((a,o)=>{a.mort&&!a.actif&&this.crates.delete(o)}),this.evenements=r,this.reindexer(),this.etiquettes(),this.sc.ombres(),r}couleurDe(e){return Bo(e*7+1)<.62?new Be(Af[Math.floor(Bo(e+9)*Af.length)]).multiplyScalar(.95+Bo(e+3)*.1):new Be(Cf[Math.floor(Bo(e+5)*Cf.length)])}demarrer(e,t,n,i,r){let a=this.courant(e);if(e.de=a,e.t0=n,e.dur=380,e.actif=!!i,t===null)e.vers=a.map(o=>Object.assign({},o)),e.ech0=e.ech,e.ech1=0;else for(e.t=t,e.vers=t.parts.map(o=>Object.assign({},o)),e.ech0=e.ech,e.ech1=1;e.de.length<e.vers.length;){let o=e.de[0]||e.vers[0];e.de.push(Object.assign({},o,{sy:.01}))}i||(e.parts=e.vers.map(o=>Object.assign({},o)),e.ech=e.ech1,e.actif=!1,e.k=1)}courant(e){return e.parts.length?e.parts.map(t=>Object.assign({},t)):e.vers.map(t=>Object.assign({},t))}reindexer(){let e=Array.from(this.crates.values()).sort((i,r)=>i.id-r.id),t=e.length*2,n=e.filter(i=>i.t&&i.t.palette).length;(!this.cr||this.cr.instanceMatrix.count<t)&&(this.cr&&(this.g.remove(this.cr),this.cr.dispose()),this.cr=new gn(this.geoCaisse(),this.mat({vertexColors:!0}),Math.max(8,t+16)),this.cr.castShadow=!0,this.cr.receiveShadow=!0,this.cr.frustumCulled=!1,this.g.add(this.cr)),this.idx=[],e.forEach((i,r)=>{i.i0=r*2,this.idx[r*2]=i,this.idx[r*2+1]=i}),this.cr.count=t,(!this.pal||this.pal.instanceMatrix.count<n)&&(this.pal&&(this.g.remove(this.pal),this.pal.dispose()),this.geoPal=this.geoPal||this.suivre(Tc()),this.pal=new gn(this.geoPal,this.matPal||(this.matPal=this.mat({vertexColors:!0})),Math.max(8,n+16)),this.pal.castShadow=!0,this.pal.receiveShadow=!0,this.pal.frustumCulled=!1,this.g.add(this.pal)),this.ecrireTout()}geoCaisse(){if(!this.geoC){let e=new ct;e.boite(1,1,1,0,0,0,14342874),e.boite(.16,1.014,1.014,0,0,0,16777215),e.boite(1.014,.05,1.014,0,.5,0,15658734),this.geoC=this.suivre(e.fin())}return this.geoC}ecrireTout(){this.crates.forEach(e=>this.ecrire(e)),this.cr.instanceMatrix.needsUpdate=!0,this.cr.instanceColor&&(this.cr.instanceColor.needsUpdate=!0),this.cr.boundingSphere=null,this.ecrirePalettes()}ecrirePalettes(){let e=0;this.crates.forEach(t=>{if(t.t&&t.t.palette&&!t.mort){let n=t.parts[0]||t.vers[0];if(!n)return;this.pal.setMatrixAt(e++,Oo.compose(Dc.set(n.x,0,n.z),Lc.identity(),Nc.set(1,1,1).multiplyScalar(Math.min(1,Math.max(.55,n.sx/.62))*Math.max(0,t.ech))))}}),this.pal.count=e,this.pal.instanceMatrix.needsUpdate=!0}teinteDe(e){return _s.copy(e.couleur),this.cible!==null&&e.id!==this.cible&&_s.lerp(g_,.72),(e.id===this.survolId||e.id===this.focusId)&&_s.lerp(x_,.3),e.pulse&&performance.now()-e.pulse<900&&_s.lerp(new Be("#7fd0ff"),.6*(1-(performance.now()-e.pulse)/900)),_s}ecrire(e){let t=e.parts.length||e.vers.length;for(let n=0;n<2;n++){let i=e.i0+n,r=e.parts[n];if(!r||n>=t||e.ech<=.001){this.cr.setMatrixAt(i,Oo.makeScale(0,0,0)),this.cr.setColorAt(i,_s.set(16777215));continue}this.cr.setMatrixAt(i,Oo.compose(Dc.set(r.x,r.y,r.z),Lc.identity(),Nc.set(r.sx*e.ech,r.sy*e.ech,r.sz*e.ech))),this.cr.setColorAt(i,n?this.teinteDe(e).clone().multiplyScalar(.94):this.teinteDe(e))}}maj(e){let t=!1;this.crates.forEach((i,r)=>{if(i.pulse&&e-i.pulse<900&&(t=!0,i.sale=!0),!i.actif)return;let a=Math.min(1,(e-i.t0)/i.dur),o=i.ech1>i.ech0?qt.ressort(a):qt.sortie(a);i.ech=kt(i.ech0,i.ech1,o);let l=qt.entreeSortie(a),c=Math.max(i.de.length,i.vers.length);i.parts=[];for(let u=0;u<c;u++){let h=i.de[u]||i.vers[u],f=i.vers[u]||i.de[u];i.parts.push({x:kt(h.x,f.x,l),y:kt(h.y,f.y,l),z:kt(h.z,f.z,l),sx:kt(h.sx,f.sx,l),sy:kt(h.sy,f.sy,l),sz:kt(h.sz,f.sz,l)})}a>=1?(i.actif=!1,i.ech=i.ech1,i.parts=i.vers.map(u=>Object.assign({},u)),i.sale=!0,i.mort&&(i.supprimer=!0),this.faitFin=!0):t=!0,i.sale=!0}),this.drag&&(t=!0);let n=!1;if(this.crates.forEach(i=>{i.sale&&(this.ecrire(i),i.sale=!1,n=!0)}),n&&(this.cr.instanceMatrix.needsUpdate=!0,this.cr.instanceColor&&(this.cr.instanceColor.needsUpdate=!0),this.cr.boundingSphere=null,this.ecrirePalettes()),this.faitFin){this.faitFin=!1;let i=!1;this.crates.forEach((r,a)=>{r.supprimer&&(this.crates.delete(a),i=!0)}),i&&this.reindexer(),this.etiquettes()}return t}etiquettes(){this.atlas.liberer(this.g),this.atlas=new _r(this.sc.aniso),this.construireRepaires(),this.crates.forEach(e=>{let t=e.t;if(!t||!t.plaque||e.actif||e.mort||this.cible!==null&&e.id!==this.cible)return;let n=e.l,i=this.atlas.ajouter(Un.caisse(n.code,this.fmt(n.quantite),n.unite,n.bas)),r=e.parts[e.parts.length>1,0]||e.vers[0],a=Math.min(r.sx*.94,r.sy*.8*224/84,.62),o=a*84/224,l=r.y-r.sy*.04;this.atlas.quad(i,vr(r.x,l,r.z+r.sz/2+.006,a,o,0)),this.atlas.quad(i,vr(r.x,l,r.z-r.sz/2-.006,a,o,Math.PI))}),this.cible===null&&this.plus.forEach(e=>{let t=this.atlas.ajouter(Un.plus(e.k)),n=this.type==="cube"?.17:.24;this.atlas.quad(t,vr(e.c.x+this.L.bw/2-.2,e.c.y0+this.L.lh-.2,e.c.z+this.L.rd/2+.015,n*224/84,n,0))}),this.atlas.construire(this.g)}construireRepaires(){let e=this.L,t=this.atlas,n=(a,o,l,c,u,h)=>t.quad(a,vr(o,l,c,u*224/84,u,h));e.rows.forEach(a=>{let o=a.x0,l=a.z+e.rd/2,c=o+e.S*e.bw+.12,u=this.type==="cube"?.34:.52,h=this.type==="cube"?.17:.24,f=this.type==="cube"?a.allee===1?"G":"D":String.fromCharCode(64+(a.allee>26?26:a.allee));n(t.ajouter(Un.lettre(f,this.type==="cube"?"#2d6cdf":"#1f5fbf")),c+.04,e.Hr+u*.62,a.z,u,Math.PI/2);for(let d=0;d<e.S;d++)n(t.ajouter(Un.lettre(String(d+1),"#f28c28")),o+(d+.5)*e.bw,e.yb+h*.7,l+.012,h,0);for(let d=0;d<e.N;d++)n(t.ajouter(Un.lettre(String(d+1),"#46536b")),c,e.yb+(d+.5)*e.lh,a.z,h,Math.PI/2)});let i=e.zone,r=this.type==="cube"?.26:.36;n(t.ajouter(Un.zone("À ranger")),i.x+i.w/2-.05,1.05+r*.5,i.z-i.d/2+.07,r*2.7,0)}fmt(e){let t=parseFloat(e);return isNaN(t)?"":this.sc.o.fmtQte?this.sc.o.fmtQte(e):String(Math.round(t*1e3)/1e3).replace(".",",")}rayon(e,t){let n=this.sc;return n.ndc.set(e/n.w*2-1,-(t/n.h)*2+1),n.ray.setFromCamera(n.ndc,n.vue.cam),n.ray}viser(e,t){if(e<0)return{id:null,cell:null,zone:!1};let n=this.rayon(e,t),i=this.L,r=null,a=1e9;if(this.cr&&this.idx.length){let f=n.intersectObject(this.cr,!1);for(let d of f){let g=this.idx[d.instanceId];if(g&&!g.mort&&g.ech>.5){r=g.id,a=d.distance;break}}}let o=n.ray.origin,l=n.ray.direction,c=null,u=1e9;for(let f of i.rows){let d=[f.x0,0,f.z-i.rd/2],g=[f.x0+i.rowW,i.Hr,f.z+i.rd/2],x=0,p=1e9,m=!0;for(let M=0;M<3;M++){let E=M===0?o.x:M===1?o.y:o.z,y=M===0?l.x:M===1?l.y:l.z;if(Math.abs(y)<1e-9){if(E<d[M]||E>g[M]){m=!1;break}continue}let b=(d[M]-E)/y,w=(g[M]-E)/y;if(b>w){let A=b;b=w,w=A}if(x=Math.max(x,b),p=Math.min(p,w),x>p){m=!1;break}}if(m&&x<u){let M=o.x+l.x*x,E=o.y+l.y*x;c={a:f.allee,e:ut(Math.floor((M-f.x0)/i.bw)+1,1,i.S),n:ut(Math.floor((E-i.yb)/i.lh)+1,1,i.N)},u=x}}let h=!1;if(Math.abs(l.y)>1e-6){let f=-o.y/l.y,d=o.x+l.x*f,g=o.z+l.z*f,x=i.zone;h=f>0&&f<u&&Math.abs(d-x.x)<=x.w/2&&Math.abs(g-x.z)<=x.d/2}if(r!==null){let f=this.crates.get(r),d=f.t;d&&!d.zone&&!d.cachee?(c={a:d.a,e:d.e,n:d.n},h=!1):d&&d.zone&&(c=null,h=!0)}return{id:r,cell:c,zone:h}}infoCase(e){let t=this.L;if(e.zone)return{zone:!0,lignes:this.lignes.filter(i=>!this.placee(i)),focus:e.id};if(!e.cell)return null;let n=this.lignes.filter(i=>this.placee(i)&&i.rangement.allee===e.cell.a&&i.rangement.etagere===e.cell.e&&i.rangement.niveau===e.cell.n);return{rangement:{allee:e.cell.a,etagere:e.cell.e,niveau:e.cell.n},lignes:n,focus:e.id!==null?e.id:n[0]?n[0].piece_id:null,type:this.type}}survol(e,t){if(this.drag)return;let n=this.viser(e,t),i=this.infoCase(n),r=n.id,a=(l,c)=>!l&&!c||l&&c&&JSON.stringify(l.rangement)===JSON.stringify(c.rangement)&&!!l.zone==!!c.zone;!(r!==this.survolId)&&a(i,this.infoSurvol)||(this.survolId=r,this.infoSurvol=i,this.cadreSur(n.cell,n.zone?"zone":n.id!==null||i&&i.lignes&&i.lignes.length?"survol":"vide"),this.sc.canvas.style.cursor=r!==null||n.zone||n.cell&&i.lignes.length?"pointer":"",this.crates.forEach(l=>{l.sale=!0}),this.sc.demander(),this.flammes.length&&this.eveiller(3500),this.sc.o.surCaisse&&this.sc.o.surCaisse(i,e,t,r))}quitter(){this.survolId=null,this.infoSurvol=null,this.cadreSur(null),this.crates.forEach(e=>{e.sale=!0}),this.sc.canvas.style.cursor="",this.sc.o.surCaisse&&this.sc.o.surCaisse(null),this.sc.demander()}clic(e,t){let n=this.viser(e,t),i=this.infoCase(n),r=n.id!==null?n.id:i&&i.lignes&&i.lignes[0]?i.lignes[0].piece_id:null;this.sc.o.surCaisseClic&&this.sc.o.surCaisseClic(r,i)}mettreEnAvant(e){this.focusId=e;let t=e!==null?this.crates.get(e):null,n=t&&t.t;this.cadreSur(n&&!n.zone?{a:n.a,e:n.e,n:n.n}:null,"survol"),this.crates.forEach(i=>{i.sale=!0}),t&&this.sc.o.surCaisse&&this.sc.o.surCaisse(this.infoCase({id:e,cell:n&&!n.zone?{a:n.a,e:n.e,n:n.n}:null,zone:!!(n&&n.zone)}),-1,-1,e),this.sc.demander()}cadreSur(e,t){let n=this.L;if(!this.cadreMesh){let r=new ct,a=n.bw-.02,o=n.lh-.02,l=n.rd+.06,c=.05;for(let u of[-1,1])for(let h of[-1,1])r.boite(a,c,c,0,u*o/2,h*l/2,16777215);for(let u of[-1,1])for(let h of[-1,1])r.boite(c,o,c,u*a/2,0,h*l/2,16777215);for(let u of[-1,1])for(let h of[-1,1])r.boite(c,c,l,u*a/2,h*o/2,0,16777215);this.cadreMat=new Tt({vertexColors:!0,color:16777215,toneMapped:!1,transparent:!0,opacity:.95}),this.jet.push(this.cadreMat),this.cadreMesh=new We(this.suivre(r.fin()),this.cadreMat),this.cadreMesh.renderOrder=5,this.cadreMesh.visible=!1,this.g.add(this.cadreMesh)}if(!e){this.cadreMesh.visible=!1;return}let i=this.cellule(e.a,e.e,e.n);if(!i){this.cadreMesh.visible=!1;return}this.cadreMesh.position.set(i.x,i.y0+n.lh/2+.04,i.z),this.cadreMat.color.set(t==="cible"?3129194:t==="refus"?14698044:t==="recherche"?3107839:t==="vide"?12109016:16753183),this.cadreMesh.visible=!0,this.sc.demander()}debutGlisse(e,t){if(!this.peutRanger)return null;let n=this.viser(e,t);if(n.id===null)return null;let i=this.crates.get(n.id);if(!i||!i.t||i.t.cachee)return null;let r=i.t.zone?null:{allee:i.t.a,etagere:i.t.e,niveau:i.t.n},a=this;return{move(o,l){a.drag||(a.drag={c:i,origine:r,cible:void 0,de:i.parts.map(g=>Object.assign({},g))},i.actif=!1,a.quitter(),a.sc.canvas.style.cursor="grabbing");let c=a.rayon(o,l),u=c.ray.intersectPlane(__,new D),h=a.viser(o,l),f=h.zone?null:h.cell?{allee:h.cell.a,etagere:h.cell.e,niveau:h.cell.n}:void 0;a.drag.cible=f,u&&(i.parts=i.parts.map((g,x)=>Object.assign({},g,{x:u.x,y:u.y+x*.3,z:u.z})),i.sale=!0);let d=f!=null&&r&&f.allee===r.allee&&f.etagere===r.etagere&&f.niveau===r.niveau;a.cadreSur(f?{a:f.allee,e:f.etagere,n:f.niveau}:null,f===void 0?"refus":d?"vide":"cible"),a.sc.demander()},fin(o,l,c){let u=a.drag;if(a.drag=null,a.cadreSur(null),!u)return;let h=u.cible,f=h!==void 0&&(h===null&&!u.origine||h&&u.origine&&h.allee===u.origine.allee&&h.etagere===u.origine.etagere&&h.niveau===u.origine.niveau);if(c!=="glisse"||h===void 0||f){a.rendre(i,u.de);return}let d=a.lignes.find(m=>m.piece_id===i.id),g=d.rangement;d.rangement=h?Object.assign({},h):null,a.reconstruire(!1);let x=()=>{},p=()=>{d.rangement=g,a.reconstruire(!1)};a.sc.o.surRanger?a.sc.o.surRanger(i.id,h,x,p):x()}}}rendre(e,t){e.parts=t,e.vers=t.map(n=>Object.assign({},n)),e.actif=!1,e.ech=1,e.sale=!0,this.sc.demander()}chercher(e,t){this.cible=e===void 0?null:e,this.pin&&(this.g.remove(this.pin.g),this.pin=null);let n=this.cible!==null?this.crates.get(this.cible):null;if(n&&n.t&&!n.t.cachee){let i=n.t,r=i.ytop+.55,a=new Mt,o=this.pinMat||(this.pinMat=this.mat({color:3107839,emissive:731786,emissiveIntensity:.55,depthTest:!1,transparent:!0})),l=this.pinDisque||(this.pinDisque=new Tt({color:16777215,depthTest:!1,transparent:!0}));this.jet.push(l),this.pinGeo=this.pinGeo||this.suivre(Ic()),this.pinDisqueGeo=this.pinDisqueGeo||this.suivre(new Rn(.54,.54));let c=new We(this.pinGeo,o),u=new We(this.pinDisqueGeo,l);c.castShadow=!1,c.renderOrder=6,u.renderOrder=7,u.position.set(0,2,.63),a.add(c,u);let h=this.type==="cube"?.5:.7;a.scale.setScalar(h),a.position.set(i.x||0,r+3,i.z||0),a.rotation.y=this.sc.vue.e.az,this.g.add(a),this.pin={g:a,y:r,k:h};let f=i.zone?null:{a:i.a,e:i.e,n:i.n};this.cadreSur(f,"recherche"),this.sc.reduit()?a.position.y=r:this.sc.anim.ajouter({dur:800,delai:200,courbe:qt.rebond,f:d=>{a.position.y=kt(r+3,r,d),this.sc.ombres()},fin:()=>{a.position.y=r}}),t&&this.cadrerSur(i)}else this.cadreSur(null);this.crates.forEach(i=>{i.sale=!0}),this.etiquettes(),this.sc.ombres()}cadrerSur(e){let t=this.sc,n=this.L,i=t.vue.cible("az"),r=e.x,a=e.z,o=e.parts&&e.parts[0]?e.parts[0].y:1,l=n.bw*2.8,c=[];[-1,1].forEach(h=>[-1,1].forEach(f=>[0,1].forEach(d=>c.push({x:r+h*l/2,y:d*(this.type==="cube"?2:3.6),z:a+f*1.6}))));let u=t.cadre(c,i,40,t.vue.cible("el"));u.ech=ut(u.ech,t.limites.echMin,t.limites.echMax),t.vue.utilisee=!0,t.vue.aller(u,700)}majLignes(e){let t=JSON.stringify(e.map(n=>[n.piece_id,n.code,n.quantite,n.unite,!!n.bas,n.rangement?[n.rangement.allee,n.rangement.etagere,n.rangement.niveau]:null]));return t===this.sigLignes?[]:(this.sigLignes=t,this.lignes=e.map(n=>Object.assign({},n)),this.reconstruire(!1))}rapport(){let e=this.sc,t={suivis:{}};return this.suivis.forEach(n=>{let i=this.crates.get(n),r=i&&(i.parts[0]||i.vers[0]);if(r){let a=e.vue.ecran({x:r.x,y:r.y+r.sy/2,z:r.z},{});t.suivis[n]={x:a.x,y:a.y}}}),t}positionEcran(e){let t=this.crates.get(e),n=t&&(t.parts[0]||t.vers[0]);if(!n)return null;let i=this.sc.vue.ecran({x:n.x,y:n.y+n.sy/2,z:n.z},{});return{x:i.x,y:i.y}}positionCellule(e,t,n){let i=this.cellule(e,t,n);if(!i)return null;let r=this.sc.vue.ecran({x:i.x,y:i.y0+this.L.lh*.45,z:i.z+this.L.rd/2-.25},{});return{x:r.x,y:r.y}}positionZone(){let e=this.L.zone,t=this.sc.vue.ecran({x:e.x,y:.05,z:e.z},{});return{x:t.x,y:t.y}}nombreCaisses(){let e=0;return this.crates.forEach(t=>{!t.mort&&t.t&&!t.t.cachee&&e++}),e}detail(){let e=[];return this.crates.forEach(t=>{!t.mort&&t.t&&e.push({id:t.id,zone:!!t.t.zone,a:t.t.a||0,e:t.t.e||0,n:t.t.n||0,cachee:!!t.t.cachee})}),e}liberer(){this.atlas.liberer(this.g),this.sc.scene.remove(this.g),this.g.traverse(e=>{e.isInstancedMesh&&e.dispose()}),this.jet.forEach(e=>{e&&e.dispose&&e.dispose()}),this.jet=[],this.crates.clear(),this.idx=[]}};var Uc=3095116;function M_(s,e,t){let n=gr(s,null,e,0,.5);return n.rotateY(-Math.PI/2),n.translate(t+e,0,0),n}function Rf(s,e,t,n,i,r){s.cyl(.035,.045,i,e,i/2,t,9081766,6);let a=i*.62,o=[[0,0],[0,.95],[.1,1.5],[.32,1.85],[.6,1.95],[.82,1.8],[.9,1.45],[.78,1],[.55,.5],[.3,.14]].map(l=>[l[0]*a*.5,l[1]*a*.5]);s.profil(o,.03,e,i-a*1-.1,t,n,0,r||0)}function Fc(s,e,t,n,i){i=i||{};let r=!!i.bloc,a=!r&&s>=9?2.6:0,o=s-a,l=i.ox!==void 0?i.ox:-s/2+o/2,c=2.55,u=2.45,h=c+u,f=ut(e*.14,.5,1),d=l-o/2,g=l+o/2,x=e/2,p=-e/2,m=new ct,M=new ct,E=[],y=[],b=[];E.push({geo:Ci(o,c,e,l,c/2,0,.9,.9),tex:"briqueBeige",couleur:16777215}),E.push({geo:M_([[p,c],[x,c],[x,h],[p,h+f]],o,d),tex:"murs",couleur:15902621});let w=Math.atan2(f,e),A=Math.hypot(e+.9,f),v=new dt(o+.7,.14,A);{let I=v.attributes.uv;for(let U=0;U<I.count;U++){let L=I.getX(U),P=I.getY(U);I.setXY(U,P*A/.9,L*(o+.7)/.9)}}v.rotateX(w),v.translate(l,h+f/2+.06,0),E.push({geo:v,tex:"toit",couleur:15300459}),m.boite(o+.7,.2,.16,l,h+.02,x+.42,15300459),m.boite(o+.05,.16,e+.05,l,c+.02,0,15656660);let T=Math.max(2,Math.floor((o-2.8)/2.1)),R=l+o*.2;for(let I=0;I<T+1;I++){let U=d+1.1+I*(o-2.2)/T;Math.abs(U-R)<1.7||(m.boite(1.45,1.2,.1,U,1.55,x+.03,15328472),M.boite(1.25,1,.06,U,1.55,x+.08,Uc),m.boite(1.6,.1,.22,U,.9,x+.1,14275266),(U>d+4.5||o<8)&&(m.boite(.85,.85,.08,U,c+1.2,x+.03,16052198),M.boite(.68,.68,.05,U,c+1.2,x+.07,Uc)))}m.boite(2.1,2.4,.14,R,1.2,x+.05,14673646),M.boite(1.8,2.2,.08,R,1.15,x+.11,3885662),m.boite(.07,2.2,.1,R,1.15,x+.14,14673646),m.boite(3.1,.14,1,R,2.65,x+.5,15328472),m.boite(2.9,.07,.07,R,2.58,x+1,9081766),m.boite(2.4,.18,.9,R,.09,x+.45,13620964),y.push({tex:"logo",w:Math.min(3.2,o*.3),h:Math.min(3.2,o*.3)/4.89,x:d+Math.min(3.2,o*.3)/2+.7,y:c+1.25,z:x+.03,ry:0}),Rf(m,d+o*.38,x+.6,13639724,3.5,.7),Rf(m,d+o*.47,x+.6,16119287,3.5,.7),m.cyl(.07,.1,8.2,d+.5,4.1,p+.45,9081766,6);for(let I=0;I<4;I++)m.cyl(.3-I*.045,.3-(I+1)*.045,.34,d+.5-.17-I*.3,8-I*.04,p+.45,I%2?16053492:16738858,8,0,Math.PI/2+.2);return m.boite(1.4,.6,1,l+o*.3,h+f+.45,-.2,14673391),a&&b.push(Mn(s/2-1.3,.04,-e*.18,2,2,3,.1),Mn(s/2-1.3,.04,e*.2,2,2,3,-.08)),{statique:m.fin(),verre:M.fin(),couches:E,plaques:y,piles:b,h:h+f+.6,ancre:[l,h+f+.9,0],boite:[o,h+f+.2,e],boiteX:l,pin:[l,h+f+.5,0]}}function If(s,e,t,n){let i=s>=10?2.4:0,r=s-i,a=-s/2+r/2,o=-s/2,l=o+r,c=e/2,u=-e/2,h=4.2,f=13183798,d=10623524,g=9146522,x=12871516,p=new ct,m=new ct,M=[],E=[],y=[],b=r*.37,w=r*.27,A=r*.24,v=r-b-w-A,T=o+b,R=T+w,I=R+A,U=(T+R)/2;M.push({geo:Nn(r,h,e,a,h/2,0,.5),tex:null,couleur:g});let L=(k,Z,j,Ee,ye=.06)=>M.push({geo:Ci(k,Z,.12,j,Ee,c+ye/2+.02,.9,.9),tex:"briqueRouge",couleur:16777215});L(b,.8,o+b/2,.4),L(I-R,.5,(R+I)/2,.25);let P=(b-4*.38)/3;for(let k=0;k<3;k++){let Z=o+.38+P/2+k*(P+.38);p.boite(P+.2,1.7,.1,Z,1.65,c+.05,15132394),m.boite(P-.05,1.5,.06,Z,1.65,c+.1,k===1?6969938:Uc),p.boite(P*.55,.9,.05,Z,1.8,c+.12,k===1?15325636:5594475),E.push({auvent:!0,tex:"auvent",w:P+.35,l:Math.hypot(.8,.45),x:Z,y:2.82,z:c+.4,rx:Math.atan2(.45,.8)}),p.boite(P+.35,.18,.06,Z,2.5,c+.78,d)}for(let k=0;k<=3;k++){let Z=o+.19+k*(P+.38);M.push({geo:Ci(.38,1.9,.12,Z,1.55+.35,c+.05,.9,.9),tex:"briqueRouge",couleur:16777215})}p.boite(2,2.5,.14,U,1.25,c+.06,3028032),m.boite(1.76,2.3,.08,U,1.2,c+.12,2106927),p.boite(.06,2.3,.1,U,1.2,c+.16,4870754),p.boite(.5,.2,.05,U,2.62,c+.1,13642282),M.push({geo:Ci(.55,2.6,.12,T+.28,1.3,c+.06,.9,.9),tex:"briqueRouge",couleur:16777215}),M.push({geo:Ci(.55,2.6,.12,R-.28,1.3,c+.06,.9,.9),tex:"briqueRouge",couleur:16777215}),p.boite(.8,1.7,.06,T+.95,1.5,c+.1,1711138),p.boite(.8,1.7,.06,R-.95,1.5,c+.1,2919120);let F=Math.min(1.45,w*.95/1.88),O=F*1.88;E.push({tex:"enseigneBCH",w:O,h:F,x:U,y:2.65+F/2,z:c+.04,ry:0});let G=w*1.05,Q=1.55;p.boite(G+.5,.3,.7,U,h+.15,c-.05,f),p.profil([[-G/2,0],[G/2,0],[0,Q]],.4,U,h+.3,c-.2,g,0);for(let k of[-1,1])p.boite(Math.hypot(G/2,Q)+.25,.26,.6,U+k*G/4,h+.3+Q/2,c-.05,f,0,-k*Math.atan2(Q,G/2));p.boite(A-.2,2.1,.12,(R+I)/2,1.6,c+.05,3028032),E.push({tex:"vitrines",w:A-.35,h:(A-.35)*.375,x:(R+I)/2,y:1.6,z:c+.14,ry:0}),E.push({auvent:!0,tex:"auvent",w:A+.3,l:Math.hypot(.8,.45),x:(R+I)/2,y:2.98,z:c+.4,rx:Math.atan2(.45,.8)}),p.boite(A+.3,.18,.06,(R+I)/2,2.66,c+.78,d),M.push({geo:Ci(v,7,Math.min(e,1.6),(I+l)/2,3.5,c-Math.min(e,1.6)/2+.3,.9,.9),tex:"briqueRouge",couleur:16777215}),p.boite(v+.35,.4,Math.min(e,1.6)+.35,(I+l)/2,7.2,c-Math.min(e,1.6)/2+.3,f),p.cyl(.13,.13,.8,(I+l)/2-.25,7.8,c-.5,12107464,8),p.cyl(.11,.11,.65,(I+l)/2+.25,7.7,c-.5,12107464,8),p.boite(r+.4,.45,.62,a,h+.33,c-.02,f),p.boite(.62,.45,e+.4,o-.02,h+.33,0,f),p.boite(.62,.45,e+.4,l+.02,h+.33,0,f),p.boite(r-.2,.12,e-.2,a,h+.02,0,4870236);for(let k=0;k<3;k++)p.boite(.9,.5,.7,o+r*(.2+.25*k),h+.4,-e*.2,14278632);for(let k=0;k<3;k++)p.cyl(.07,.07,.6,T-1.2+k*.3,h+.5,-.4,12107464,6);for(let[k,Z]of[[o-.1,.5],[I+.1,.55],[R-.1,.4]])p.sphere(Z,k,Z*.9,c+.55,3103290,1,1.15,1,7);if(i){p.boite(.05,1.4,e-.4,s/2-.1,.7,0,2303791);for(let k=0;k<6;k++)p.boite(.1,1.5,.1,s/2-.1,.75,-e/2+.3+k*((e-.6)/5),2303791);y.push(Mn(s/2-1.5,.04,-e*.18,2,2,3,.1),Mn(s/2-1.5,.04,e*.2,2,2,3,-.08))}return{statique:p.fin(),verre:m.fin(),couches:M,plaques:E,piles:y,h:7.8,ancre:[a,8.3,0],boite:[r,5.8,e],boiteX:a,pin:[a,h+1.9,0]}}var b_=1e3,Vo=120,Oc=50*Math.PI/180,Pf={bea:15989247,bch:16775411,neutre:16185595},Lf={bea:15135727,bch:16248035,neutre:15659252};function S_(s){let e=parseFloat(s.unites)||0;return!(s.nb_pieces>0)||e<=0?0:ut(.12+.88*Math.log10(1+e)/Math.log10(1+b_),.12,1)}var Go=class{constructor(e,t){this.o=t||{},this.conteneur=e;let n=window.matchMedia?window.matchMedia("(prefers-reduced-motion: reduce)"):null;this.reduit=()=>!!(n&&n.matches),this.anim=new Ro(this.reduit);let i=this.r=new To({antialias:!0,alpha:!0,powerPreference:"high-performance"});i.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),i.outputColorSpace=Ct,i.shadowMap.enabled=!0,i.shadowMap.type=bi,i.shadowMap.autoUpdate=!1,i.setClearColor(0,0);let r=this.canvas=i.domElement;r.className="pl3-canevas",r.setAttribute("role","img"),r.setAttribute("tabindex","0"),this.o.libelle&&r.setAttribute("aria-label",this.o.libelle),e.insertBefore(r,e.firstChild),this.aniso=Math.min(4,i.capabilities.getMaxAnisotropy()),this.scene=new Ns,this.hemi=new tr(16777215,11188436,1.55),this.scene.add(this.hemi),this.soleil=new ir(16774116,2.35),this.soleil.castShadow=!0,this.soleil.shadow.mapSize.set(window.innerWidth<768?1024:2048,window.innerWidth<768?1024:2048),this.soleil.shadow.bias=-6e-4,this.soleil.shadow.normalBias=.05,this.soleil.shadow.radius=3.5,this.scene.add(this.soleil,this.soleil.target),this.tex={murs:pf(this.aniso),toit:mf(this.aniso),dalles:gf(this.aniso)},this.texMarque={},this.plaques={},this.logos={},this.chargerLogos(this.o.logos),this.sig="",this.cleRecherche="",this.rechercheFaite=!1,this.B=new Map,this.pickables=[],this.monde=null,this.cleMonde="",this.groupe=new Mt,this.scene.add(this.groupe),this.images=0,this.dessins=0,this.triangles=0,this.demande=!1,this.detruit=!1,this.perdu=!1,this.ombresSale=!0,this.selId=null,this.survolId=null,this.recherche=null,this.azSoleil=null,this.marges={g:20,d:20,h:78,b:22},this.ray=new sr,this.ndc=new oe,this.limites={x0:-50,x1:50,z0:-50,z1:50,echMin:4,echMax:90},this.fit=12,this.bornes=null,this.effets=new Fo(this.scene,this.anim,()=>this.demander(),()=>{this.ombresSale=!0}),this.ms=0,this.rem=new No(this.scene,this.anim,()=>this.demander()),this.vue=new Lo(r,{anim:this.anim,demander:()=>this.demander(),limites:()=>this.limites,recentrer:()=>this.recentrer(!0),surChange:()=>this.camChange(),cadreAzimut:o=>{if(!this.bornes||!this.w)return null;let l=this.cadre(this.pointsDe(this.bornes),o,0,this.elCourant());return l.ech=Math.min(l.ech*.98,this.int?Vo:26),l.el=this.elCourant(),l},surClic:(o,l)=>this.clic(o,l),surSurvol:(o,l)=>{this.int?o<0?this.int.quitter():this.int.survol(o,l):this.survoler(o,l)},debutGlisse:(o,l)=>this.int?this.int.debutGlisse(o,l):null}),this.int=null,this.dernierClic=null;let a=()=>{let o=e.getBoundingClientRect();this.taille(o.width,o.height)};this.ro=typeof ResizeObserver=="function"?new ResizeObserver(a):null,this.ro?this.ro.observe(e):(window.addEventListener("resize",a),this.ecouteResize=a),this.surVisibilite=()=>{document.hidden?(cancelAnimationFrame(this.raf),this.demande=!1):this.demander()},document.addEventListener("visibilitychange",this.surVisibilite),this.surPerte=o=>{o.preventDefault(),this.perdu=!0,cancelAnimationFrame(this.raf),this.demande=!1,clearTimeout(this.minutePerte),this.minutePerte=setTimeout(()=>{this.perdu&&this.o.surPerte&&this.o.surPerte()},3500)},this.surRestaure=()=>{clearTimeout(this.minutePerte),this.perdu=!1,this.ombresSale=!0,this.demander()},r.addEventListener("webglcontextlost",this.surPerte),r.addEventListener("webglcontextrestored",this.surRestaure),a(),this.reglerSoleil(!0)}demander(){this.demande||this.detruit||this.perdu||document.hidden||(this.demande=!0,this.raf=requestAnimationFrame(e=>this.dessiner(e)))}ombres(){this.ombresSale=!0,this.demander()}dessiner(){if(this.demande=!1,this.detruit||this.perdu)return;let e=performance.now(),t=this.anim.maj(e);this.rem.maj(e)&&(t=!0,this.ombresSale=!0),this.int&&(this.int.maj(e)&&(t=!0,this.ombresSale=!0),this.int.animer(e)&&(t=!0)),this.ombresSale&&(this.r.shadowMap.needsUpdate=!0,this.ombresSale=!1),this.r.render(this.scene,this.vue.cam),this.images++,this.dessins=this.r.info.render.calls,this.triangles=this.r.info.render.triangles,this.rapporter(),this.ms=performance.now()-e,(t||this.anim.actif()||this.rem.occupe)&&this.demander()}taille(e,t){this.detruit||e<2||t<2||this.w===Math.round(e)&&this.h===Math.round(t)||(this.w=Math.round(e),this.h=Math.round(t),this.r.setSize(this.w,this.h,!1),this.vue.taille(this.w,this.h),this.calculerLimites(),!this.vue.utilisee&&this.bornes&&this.recentrer(!1),this.camChange(),this.demander())}reglerSoleil(e){let t=this.vue.e.az;if(!e&&this.azSoleil!==null&&Math.abs(t-this.azSoleil)<1e-4)return;this.azSoleil=t;let n=Math.sin(t),i=Math.cos(t),r=-.62*i+.56*n,a=.62*n+.56*i,o=Math.hypot(r,a);r/=o,a/=o;let l=54*Math.PI/180,c=this.bornes||{x0:-20,x1:20,z0:-15,z1:15},u=(c.x0+c.x1)/2,h=(c.z0+c.z1)/2,f=Math.hypot(c.x1-c.x0,c.z1-c.z0)/2+24;this.soleil.position.set(u+r*Math.cos(l)*220,Math.sin(l)*220,h+a*Math.cos(l)*220),this.soleil.target.position.set(u,0,h),this.soleil.target.updateMatrixWorld();let d=this.soleil.shadow.camera;d.left=-f,d.right=f,d.top=f,d.bottom=-f,d.near=20,d.far=460,d.updateProjectionMatrix(),this.ombresSale=!0}camChange(){this.reglerSoleil(!1),this.int&&(this.int.orienter(this.vue.e.az),this.int.pin&&(this.int.pin.g.rotation.y=this.vue.e.az)),this.effets.orienterTout(this.vue.e.az,this.vue.e.ech),this.demander()}materiauxMarque(e){return this.texMarque[e.cle]||(this.texMarque[e.cle]={enseigne:xf(e.nom||"Plan",e.c[0],e.c[1],!1,this.aniso),auvent:_f(e.auvent[0],e.auvent[1],this.aniso,e.cle==="bch"?4:1)}),this.texMarque[e.cle]}texte(e){let t=this.tex;return t[e]||(t[e]=e==="briqueBeige"?Pc("#dccaa6","#c9b58e","#a99c80",this.aniso):e==="briqueRouge"?Pc("#c9695d","#b4584d","#8e8378",this.aniso):e==="vitrines"?bf(this.aniso):null),t[e]}abonnerLogo(e,t){let n=this.logos[e];n&&(n.abonnes.push(t),n.img&&t(n.img))}chargerLogos(e){this.logos={},Object.keys(e||{}).forEach(t=>{let n=this.logos[t]={img:null,abonnes:[]},i=new Image;i.onload=()=>{this.detruit||(n.img=i,n.abonnes.forEach(r=>r(i)),this.demander())},i.onerror=()=>{},i.src=e[t]})}plaqueTex(e,t){let n=t.w/t.h,i=t.tex+":"+e.cle+":"+n.toFixed(2);if(!this.plaques[i]){let r;t.tex==="enseigneBCH"?(r=Mf(n,this.aniso),this.abonnerLogo("bch",r.dessiner)):t.tex==="vitrines"?r={tex:this.texte("vitrines")}:(r=yf(n,e.nom||"Plan",e.c[0],e.c[1],e.logo?e.logo.mode:"blanc",this.aniso),e.logo&&this.abonnerLogo(e.cle,r.dessiner)),this.plaques[i]=r}return this.plaques[i].tex}fabriquer(e,t){let n=ju(e.entreprise_code,e.entreprise_nom),i=t.largeur/20,r=t.hauteur/20,a=(t.x+t.largeur/2)/20,o=(t.y+t.hauteur/2)/20,l=ui(e.id*31+7),c;if(e.type==="entrepot"){let b=Math.max(4,i-1.4),w=Math.max(3,r-1.4);if(n.cle==="bea"&&b>=13){let A=ut(b*.27,4.2,6);c=w_(wc(b,w,n,l,{bureau:A}),Fc(A,w,n,l,{bloc:!0,ox:-b/2+A/2}),b)}else c=wc(b,w,n,l)}else if(e.type==="boutique"){let b=Math.max(5,i-1.8),w=Math.max(4,r-1.2);c=n.cle==="bch"?If(b,w,n,l):n.cle==="bea"?Fc(b,w,n,l):ef(b,w,n,l)}else c=tf(i,r,n,l);let u=c.echelle||1,h=new Mt;h.position.set(a,0,o),h.scale.setScalar(u);let f=[],d=[],g=(b,w)=>{let A=new At(b);return A.userData.c0=A.color.clone(),w!==!1&&f.push(A),d.push(A),A},x=(b,w,A)=>{if(!b)return null;let v=new We(b,w);return v.castShadow=A!==!1,v.receiveShadow=!0,h.add(v),d.push(b),v},p=this.materiauxMarque(n);x(c.statique,g({vertexColors:!0})),c.murs&&x(c.murs,e.type==="boutique"?g({color:Lf[n.cle]||Lf.neutre}):g({map:this.tex.murs,color:Pf[n.cle]||Pf.neutre})),c.toit&&x(c.toit,g({map:this.tex.toit,color:n.toit})),(c.couches||[]).forEach(b=>{let w={color:b.couleur};b.tex&&(w.map=this.texte(b.tex)),x(b.geo,g(w))}),c.verre&&x(c.verre,c.vitreTrans?g({vertexColors:!0,transparent:!0,opacity:.4,depthWrite:!1},!1):g({vertexColors:!0,emissive:1713984,emissiveIntensity:.3}),!1);let m=new Map;c.plaques.forEach(b=>{let w,A;if(b.auvent){w=new dt(b.w,.07,b.l);let T=w.attributes.uv;for(let R=0;R<T.count;R++)T.setXY(R,T.getX(R)*b.w/1,T.getY(R));w.rotateX(b.rx),A=p.auvent}else w=new Rn(b.w,b.h),A=b.tex&&b.tex!=="enseigne"?this.plaqueTex(n,b):p.enseigne;b.ry&&w.rotateY(b.ry),w.translate(b.x,b.y,b.z);let v=(b.auvent?"a:":"p:")+A.uuid;m.has(v)||m.set(v,{auvent:!!b.auvent,tx:A,geos:[]}),m.get(v).geos.push(w)}),m.forEach(b=>{let w=b.auvent?g({map:b.tx,color:16777215}):g({map:b.tx,color:16777215,transparent:!0,emissive:16777215,emissiveMap:b.tx,emissiveIntensity:.3});x(Ai(b.geos),w,b.auvent)});let M=new We(new dt(c.boite[0],c.boite[1],c.boite[2]),new At({visible:!1}));M.position.set(c.boiteX||0,c.boite[1]/2,0),M.userData.id=e.id,h.add(M),d.push(M.geometry,M.material),this.groupe.add(h),this.pickables.push(M);let E=c.piles.reduce((b,w)=>b+w.cols*w.rows*w.layers,0),y=!!(n.logo&&(c.plaques||[]).some(b=>b.tex==="logo"||b.tex==="enseigneBCH"));return{id:e.id,cle:Df(e,t),t:e,m:n,type:e.type,g:h,pick:M,mats:f,jet:d,cx:a,cz:o,w:c.boite[0]*u,d:c.boite[2]*u,tw:i,td:r,e:u,h:c.h*u,cap:E,piles:c.piles,hasLogo:y,ancre:new D(a+c.ancre[0]*u,c.ancre[1]*u,o+c.ancre[2]*u),pin:c.pin,pinY:c.pin[1]*u,pinEchelle:e.type==="cube"?.72:e.type==="boutique"?.85:1,fade:0,cartons:0}}retirer(e){this.groupe.remove(e.g),this.pickables.splice(this.pickables.indexOf(e.pick),1),e.jet.forEach(t=>t.dispose()),this.effets.retirerEpingle(e.id)}definirDonnees(e,t,n){if(this.detruit)return;n=n||{};let i=e.map(h=>h.id+":"+h.unites+":"+h.nb_pieces+":"+h.nb_bas+":"+h.type+":"+h.entreprise_code+":"+(t[h.id]?[t[h.id].x,t[h.id].y,t[h.id].largeur,t[h.id].hauteur].join(","):"-")).join("|");if(i===this.sig){e.forEach(h=>{let f=this.B.get(h.id);f&&(f.t=h)});return}this.sig=i;let r=new Set,a=[],o=!1;e.forEach(h=>{let f=t[h.id];if(!f)return;r.add(h.id);let d=this.B.get(h.id),g=Df(h,f);if(d&&d.cle===g){d.t=h;return}d&&this.retirer(d);let x=this.fabriquer(h,f);this.B.set(h.id,x),a.push(x),o=!0}),Array.from(this.B.keys()).forEach(h=>{r.has(h)||(this.retirer(this.B.get(h)),this.B.delete(h),this.selId===h&&(this.selId=null,this.effets.selection(null)),o=!0)});let l=Array.from(this.B.values()).map(h=>({id:h.id,type:h.type,m:h.m,cx:(t[h.id].x+t[h.id].largeur/2)/20,cz:(t[h.id].y+t[h.id].hauteur/2)/20,w:t[h.id].largeur/20,d:t[h.id].hauteur/20})),c=l.map(h=>h.id+h.type+h.m.cle+h.cx+","+h.cz+","+h.w+","+h.d).sort().join("|");c!==this.cleMonde&&(this.cleMonde=c,this.monde&&(this.scene.remove(this.monde.groupe),this.monde.liberer()),this.monde=ff(l,this.tex),this.monde.groupe.traverse(h=>{h.isMesh&&h.castShadow===void 0&&(h.castShadow=!1)}),this.scene.add(this.monde.groupe),this.bornesPlan=this.etendueMonde(),this.int||(this.bornes=this.bornesPlan,this.calculerLimites(),this.reglerSoleil(!0),this.vue.utilisee||this.recentrer(!!this.premiereVue)),this.premiereVue=!0),o&&this.rem.construire(Array.from(this.B.values()).map(h=>({id:h.id,x:h.cx,z:h.cz,e:h.e,piles:h.piles})));let u={};this.B.forEach(h=>{let f=S_(h.t);h.cartons=f>0?Math.min(h.cap,Math.max(Math.min(h.cap,3),Math.round(f*h.cap))):0,u[h.id]=h.cartons}),this.rem.niveaux(u,{retards:n.retards,immediat:!this.rendu}),a.forEach(h=>{h.id===this.selId&&(h.glow=1,h.glowCible=1),this.estomperBat(h,h.fade)}),this.appliquerRecherche(!0),this.selId!==null&&this.B.has(this.selId)&&this.effets.selection(this.B.get(this.selId),this.B.get(this.selId).m.halo),this.int&&this.masquerPlan(!0),this.ombres()}etendueMonde(){let e=1e9,t=-1e9,n=1e9,i=-1e9,r=0;return this.B.forEach(a=>{e=Math.min(e,a.cx-a.tw/2),t=Math.max(t,a.cx+a.tw/2),n=Math.min(n,a.cz-a.td/2),i=Math.max(i,a.cz+a.td/2),r=Math.max(r,a.h)}),this.B.size||(e=-10,t=10,n=-8,i=8,r=5),{x0:e,x1:t,z0:n,z1:i,h:r}}pointsDe(e){let t=[];return[e.x0,e.x1].forEach(n=>[e.z0,e.z1].forEach(i=>[0,e.h].forEach(r=>t.push({x:n,y:r,z:i})))),t}cadre(e,t,n,i){i=i===void 0?this.vue.cible("el"):i;let r=this.vue.etendue(e,t,i),a=this.marges,o=n||0,l=Math.max(80,this.w-a.g-a.d-2*o),c=Math.max(80,this.h-a.h-a.b-2*o),u=Math.min(l/Math.max(r.w,1),c/Math.max(r.h,1)),h=this.vue.centre(r.cu,r.cv,t,i);return{x:h.x,z:h.z,ech:u,az:t,el:i,ox:(a.g-a.d)/2,oy:(a.h-a.b)/2}}elCourant(){return this.int?Oc:ps}calculerLimites(){if(!this.bornes||!this.w)return;let e=this.cadre(this.pointsDe(this.bornes),ds,0,this.elCourant()),t=this.bornes;if(this.int){this.fit=Math.min(e.ech*.98,Vo),this.limites={x0:t.x0-5,x1:t.x1+5,z0:t.z0-5,z1:t.z1+5,echMin:Math.max(3,this.fit*.6),echMax:Math.max(150,this.fit*10)};return}this.fit=Math.min(e.ech*.98,26),this.limites={x0:t.x0-12,x1:t.x1+12,z0:t.z0-12,z1:t.z1+12,echMin:Math.max(2.5,this.fit*.55),echMax:Math.max(72,this.fit*6)}}recentrer(e){if(!this.bornes||!this.w)return;let t=this.cadre(this.pointsDe(this.bornes),ds,0,this.elCourant());t.ech=Math.min(t.ech*.98,this.int?Vo:26),t.el=this.elCourant(),this.vue.utilisee=!1,this.vue.aller(t,e?700:0)}cadrerBatiments(e,t){if(t=t||{},this.int)return;let n=[];if(e.forEach(l=>{let c=this.B.get(l);c&&n.push(...this.pointsDe({x0:c.cx-c.tw/2-1,x1:c.cx+c.tw/2+1,z0:c.cz-c.td/2-1,z1:c.cz+c.td/2+1,h:c.h}))}),!n.length)return;let i=this.vue.cible("az"),r=this.cadre(n,i,18,ps),a=this.vue.cible("ech"),o=Math.min(r.ech,this.fit*(t.maxFit||3));t.garder&&(o=Math.max(a,o)),r.ech=ut(o,this.limites.echMin,this.limites.echMax),this.vue.utilisee=!0,r.el=ps,this.vue.aller(r,650)}definirMarges(e){Object.assign(this.marges,e),this.w&&this.vue.aller({ox:(this.marges.g-this.marges.d)/2,oy:(this.marges.h-this.marges.b)/2},350)}choisir(e,t){if(e<0)return null;this.ndc.set(e/this.w*2-1,-(t/this.h)*2+1),this.ray.setFromCamera(this.ndc,this.vue.cam);let n=this.ray.intersectObjects(this.pickables,!1);return n.length?n[0].object.userData.id:null}clic(e,t){if(this.int){this.int.clic(e,t);return}let n=this.choisir(e,t),i=performance.now();if(n!==null&&this.dernierClic&&this.dernierClic.id===n&&i-this.dernierClic.t<400){this.dernierClic=null,this.o.surDoubleClic&&this.o.surDoubleClic(n);return}this.dernierClic={id:n,t:i},this.o.surSelection&&this.o.surSelection(n,this.canvas)}survoler(e,t){let n=this.choisir(e,t);if(n===this.survolId)return;this.survolId=n,this.canvas.style.cursor=n!==null?"pointer":"";let i=n!==null?this.B.get(n):null;this.effets.survoler(i&&i.id!==this.selId?i:null,16777215),this.o.surSurvol&&this.o.surSurvol(n),this.demander()}eclat(e,t){if(!e||e.glowCible===t)return;e.glowCible=t;let n=e.glow||0;e.animEclat&&(e.animEclat.stop=!0),e.animEclat=this.anim.ajouter({dur:260,f:i=>{e.glow=n+(t-n)*i,this.estomperBat(e,e.fade)},fin:()=>{e.animEclat=null}}),this.demander()}selectionner(e,t){let n=this.selId!==null?this.B.get(this.selId):null;this.selId=e===void 0?null:e,n&&n.id!==this.selId&&this.eclat(n,0);let i=this.selId!==null?this.B.get(this.selId):null;this.effets.selection(i,i?i.m.halo:0),i&&this.eclat(i,1),i&&i.id===this.survolId&&this.effets.survoler(null),i&&(!t||t.cadrer!==!1)&&this.cadrerBatiments([i.id],{garder:!0,maxFit:2.2}),this.demander()}chercher(e,t){let n=e&&Object.keys(e).length?Object.keys(e).sort().map(r=>r+"="+e[r]).join(","):"",i=n===this.cleRecherche&&!(t&&t.forcer);this.cleRecherche=n,!(i&&this.rechercheFaite)&&(this.rechercheFaite=!0,this.recherche=e&&Object.keys(e).length?e:null,this.appliquerRecherche(!1),this.recherche&&(!t||t.cadrer!==!1)&&this.cadrerBatiments(Object.keys(this.recherche).map(Number),{maxFit:2.6}))}appliquerRecherche(e){let t=this.recherche,n=[];this.B.forEach(i=>{let r=t?t[i.id]!==void 0:!1,a=t&&!r?1:0;this.fondu(i,a),r?n.push(i):this.effets.retirerEpingle(i.id)}),n.forEach((i,r)=>{this.effets.pins.has(i.id)||this.effets.epingle(Object.assign(i,{pin:i.pin,pinY:i.pinY}),r,this.reduit())}),this.effets.orienterTout(this.vue.e.az,this.vue.e.ech),this.ombres()}fondu(e,t){if(e.fadeCible===t)return;e.fadeCible=t;let n=e.fade;e.animFondu&&(e.animFondu.stop=!0),e.animFondu=this.anim.ajouter({dur:320,f:i=>{e.fade=n+(t-n)*i,this.estomperBat(e,e.fade)},fin:()=>{e.animFondu=null,this.demander()}}),this.demander()}estomperBat(e,t){let n=e.glow||0;e.mats.forEach(i=>{i.color.copy(i.userData.c0).multiplyScalar(1-.3*t),i.emissive.setRGB(.19*t+.07*n,.215*t+.075*n,.26*t+.09*n)}),this.rem.estomper(e.id,t)}pulser(e){e.forEach(t=>{let n=this.B.get(t);n&&this.effets.pulse(n,n.m.halo,this.reduit())}),this.demander()}voler(e,t,n){let i=this.B.get(e),r=this.B.get(t);if(!i||!r){n&&n();return}let a=o=>({x:o.ancre.x,y:o.ancre.y-.8,z:o.ancre.z});this.effets.voler(a(i),a(r),n,this.reduit())}masquerPlan(e){this.groupe.visible=!e,this.monde&&(this.monde.groupe.visible=!e),this.effets.groupe.visible=!e,[this.rem.cartons,this.rem.palettes].forEach(t=>{t&&(t.visible=!e)})}entrerInterieur(e,t,n){n=n||{};let i=this.B.get(e);if(!i||this.int||this.detruit)return!1;this.sauve={e:Object.assign({},this.vue.e),utilisee:this.vue.utilisee,sel:this.selId},this.survolId!==null&&(this.survolId=null,this.effets.survoler(null)),this.int=new Mr(this,i,t,n),this.masquerPlan(!0),this.canvas.style.cursor="";let r=this.vue.cible("az");this.bornes=this.int.bornes,this.calculerLimites(),this.int.orienter(r),this.reglerSoleil(!0),this.vue.utilisee=!1;let a=this.cadre(this.pointsDe(this.bornes),r,0,Oc);return a.ech=Math.min(a.ech*.97,Vo),a.el=Oc,this.vue.aller(a,800),n.piece&&(this.int.chercher(n.piece,!1),setTimeout(()=>{if(this.int){let o=this.int.crates.get(n.piece);o&&o.t&&this.int.cadrerSur(o.t)}},this.reduit()?0:900)),this.int.flammes.length&&this.int.eveiller(6e3),this.ombres(),!0}rebatirInterieur(e,t){if(!this.int)return!1;let n=this.int.b,i=this.vue.cible("az");return this.int.liberer(),this.int=new Mr(this,n,e,t||{}),this.bornes=this.int.bornes,this.calculerLimites(),this.int.orienter(i),this.reglerSoleil(!0),this.vue.utilisee=!1,this.recentrer(!0),this.int.flammes.length&&this.int.eveiller(4e3),this.ombres(),!0}sortirInterieur(){if(!this.int)return!1;this.int.liberer(),this.int=null,this.masquerPlan(!1),this.bornes=this.bornesPlan,this.calculerLimites(),this.reglerSoleil(!0);let e=this.sauve;return this.vue.utilisee=e.utilisee,this.vue.aller({x:e.e.x,z:e.e.z,ech:e.e.ech,az:e.e.az,el:ps,ox:e.e.ox,oy:e.e.oy},700),this.canvas.style.cursor="",this.appliquerRecherche(!0),this.ombres(),!0}rapporter(){if(!this.o.surRendu)return;let e=[],t=this.w,n=this.h,i=this.vue,r=[];if(this.int){let a=this.int.rapport();this.o.surRendu({ancres:[],interieur:!0,int:a,images:this.images,dessins:this.dessins,triangles:this.triangles,ech:i.e.ech,az:i.e.az,largeur:t,hauteur:n,epingles:this.int.pin?1:0,pulses:this.effets.nPulses,vols:this.effets.nVols,actifs:this.anim.l.length,ms:this.ms||0,cartons:this.int.nombreCaisses(),caisses:this.int.nombreCaisses(),logos:Object.keys(this.logos).filter(o=>this.logos[o].img).join(",")});return}this.B.forEach(a=>{let o=i.ecran(a.ancre,{}),l=1e9,c=1e9,u=-1e9,h=-1e9,f=a.w/2,d=a.d/2,g={x:0,y:0,z:0},x={x:0,y:0,z:0};for(let E=0;E<8;E++)x.x=a.cx+(E&1?f:-f),x.z=a.cz+(E&2?d:-d),x.y=E&4?a.h:0,i.ecran(x,g),l=Math.min(l,g.x),u=Math.max(u,g.x),c=Math.min(c,g.y),h=Math.max(h,g.y);let p=i.ecran({x:a.cx,y:0,z:a.cz},{}),m=this.effets.pins.get(a.id),M={id:a.id,pin:m?Math.round(3*m.g.scale.x*i.e.ech):0,x:o.x,y:o.y,z:p.z,boite:[l,c,u,h],dedans:o.x>-40&&o.x<t+40&&o.y>-40&&o.y<n+40,cartons:a.cartons,vus:this.rem.nombreVisible(a.id),fade:a.fade,logo:a.hasLogo&&this.logos[a.m.cle]&&this.logos[a.m.cle].img?1:0};e.push(M),r.push(M)}),e.forEach(a=>{a.cache=r.some(o=>o!==a&&o.z<a.z-.5&&a.x>o.boite[0]&&a.x<o.boite[2]&&a.y>o.boite[1]+2&&a.y<o.boite[3])}),this.o.surRendu({ancres:e,images:this.images,dessins:this.dessins,triangles:this.triangles,ech:i.e.ech,az:i.e.az,largeur:t,hauteur:n,epingles:this.effets.pins.size,pulses:this.effets.nPulses,vols:this.effets.nVols,actifs:this.anim.l.length,ms:this.ms||0,logos:Object.keys(this.logos).filter(a=>this.logos[a].img).join(","),cartons:this.rem.c.reduce((a,o)=>a+(o.vers===1?1:0),0)})}detruire(){this.detruit||(this.detruit=!0,cancelAnimationFrame(this.raf),clearTimeout(this.minutePerte),this.ro?this.ro.disconnect():this.ecouteResize&&window.removeEventListener("resize",this.ecouteResize),document.removeEventListener("visibilitychange",this.surVisibilite),this.canvas.removeEventListener("webglcontextlost",this.surPerte),this.canvas.removeEventListener("webglcontextrestored",this.surRestaure),this.int&&(this.int.liberer(),this.int=null),this.anim.vider(),this.vue.liberer(),this.B.forEach(e=>{e.jet.forEach(t=>t.dispose())}),this.B.clear(),this.pickables.length=0,this.monde&&this.monde.liberer(),this.rem.liberer(),this.effets.liberer(),Object.keys(this.tex).forEach(e=>this.tex[e]&&this.tex[e].dispose()),Object.keys(this.plaques).forEach(e=>this.plaques[e].tex&&this.plaques[e].tex.dispose()),Object.keys(this.texMarque).forEach(e=>{this.texMarque[e].enseigne.dispose(),this.texMarque[e].auvent.dispose()}),this.soleil.shadow.map&&this.soleil.shadow.map.dispose(),this.scene.clear(),this.r.dispose(),this.perdu||this.r.forceContextLoss(),this.canvas.parentNode&&this.canvas.parentNode.removeChild(this.canvas))}api(){let e=this;return{definirDonnees:(t,n,i)=>{e.definirDonnees(t,n,i),e.rendu=!0},chercher:(t,n)=>e.chercher(t,n),selectionner:(t,n)=>e.selectionner(t,n),pulser:t=>e.pulser(t),voler:(t,n,i)=>e.voler(t,n,i),marges:t=>e.definirMarges(t),molette:t=>e.vue.molette(t),zoom:t=>{e.vue.utilisee=!0,e.vue.zoom(t)},pivoter:t=>e.vue.pivoter(t),recentrer:()=>e.recentrer(!0),cadrer:t=>e.cadrerBatiments(t,{maxFit:2.2}),canevas:e.canvas,redessiner:()=>e.demander(),entrerInterieur:(t,n,i)=>e.entrerInterieur(t,n,i),rebatirInterieur:(t,n)=>e.rebatirInterieur(t,n),sortirInterieur:()=>e.sortirInterieur(),interieurActif:()=>!!e.int,majInterieur:t=>e.int?e.int.majLignes(t):[],interieurChercher:(t,n)=>{e.int&&e.int.chercher(t,n!==!1)},interieurFocus:t=>{e.int&&e.int.mettreEnAvant(t)},interieurSuivre:t=>{e.int&&(e.int.suivis=new Set(t))},interieurQuitterSurvol:()=>{e.int&&e.int.quitter()},interieurInfo:()=>e.int?{cases:e.int.detail(),position:t=>e.int.positionEcran(t),cellule:(t,n,i)=>e.int.positionCellule(t,n,i),zone:()=>e.int.positionZone()}:null,stats:()=>({images:e.images,dessins:e.dessins,triangles:e.triangles,ech:e.vue.e.ech,az:e.vue.e.az,cartons:e.rem.c.filter(t=>t.vers===1).length,instances:e.rem.c.length}),detruire:()=>e.detruire()}}};function Df(s,e){return s.type+"|"+(s.entreprise_code||"")+"|"+e.x+","+e.y+","+e.largeur+","+e.hauteur}function w_(s,e,t){let n=(i,r)=>i&&r?Ai([i,r]):i||r;return{statique:n(s.statique,e.statique),verre:n(s.verre,e.verre),murs:s.murs,toit:s.toit,couches:(s.couches||[]).concat(e.couches||[]),plaques:s.plaques.concat(e.plaques),piles:s.piles,h:Math.max(s.h,e.h),ancre:[0,Math.max(s.h,e.h)+.4,0],boite:[t,Math.max(s.boite[1],e.boite[1]),s.boite[2]],boiteX:0,pin:[0,Math.max(s.h,e.h)+.1,0]}}function E_(){try{let s=document.createElement("canvas"),e=s.getContext("webgl2")||s.getContext("webgl");if(!e)return!1;let t=e.getExtension("WEBGL_lose_context");return t&&t.loseContext(),!0}catch{return!1}}function T_(s,e){return new Go(s,e).api()}window.Plan3D={disponible:E_,creer:T_};})();
