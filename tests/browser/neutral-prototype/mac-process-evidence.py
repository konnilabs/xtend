"""Read-only macOS process identity and Seatbelt observation; never signals a PID.

proc_bsdinfo layout: macOS SDK sys/proc_info.h. sandbox_check interpretation:
Mozilla security/sandbox/mac/Sandbox.mm IsMacSandboxStarted (return == 1).
Only process arguments of owned Firefox descendants are inspected, for the role;
arguments and environment values are never included in output.
"""
import ctypes,json,os,subprocess,sys

class BsdInfo(ctypes.Structure):
 _fields_=[(name,ctypes.c_uint32) for name in ['flags','status','xstatus','pid','ppid','uid','gid','ruid','rgid','svuid','svgid','reserved']]+[
  ('comm',ctypes.c_char*16),('name',ctypes.c_char*32)]+[(name,ctypes.c_uint32) for name in ['nfiles','pgid','pjobc','ttydev','ttypgid']]+[
  ('nice',ctypes.c_int32),('startSeconds',ctypes.c_uint64),('startMicroseconds',ctypes.c_uint64)]
lib=ctypes.CDLL('/usr/lib/libproc.dylib',use_errno=True)
lib.proc_pidinfo.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_uint64,ctypes.c_void_p,ctypes.c_int]
lib.proc_pidpath.argtypes=[ctypes.c_int,ctypes.c_void_p,ctypes.c_uint32]
seatbelt=ctypes.CDLL('/usr/lib/libsandbox.1.dylib',use_errno=True)
seatbelt.sandbox_check.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_int]
seatbelt.sandbox_check.restype=ctypes.c_int
def identity(pid):
 data=BsdInfo()
 if lib.proc_pidinfo(pid,3,0,ctypes.byref(data),ctypes.sizeof(data))!=ctypes.sizeof(data):return None
 buf=ctypes.create_string_buffer(4096)
 if lib.proc_pidpath(pid,buf,len(buf))<=0:return None
 return {'pid':data.pid,'parent':data.ppid,'group':data.pgid,'uid':data.uid,'ruid':data.ruid,'svuid':data.svuid,
  'start':f'{data.startSeconds}.{data.startMicroseconds:06d}','executable':buf.value.decode(),'state':data.status}
root_pid=int(sys.argv[1]);bundle=os.path.realpath(sys.argv[2])
table=[tuple(map(int,line.split())) for line in subprocess.check_output(['/bin/ps','-axo','pid=,ppid=,pgid='],text=True).splitlines() if line.strip()]
descendants={root_pid}
while True:
 expanded=descendants|{pid for pid,parent,group in table if parent in descendants}
 if expanded==descendants:break
 descendants=expanded
rows=[]
for pid,parent,group in table:
 if pid not in descendants and group!=root_pid:continue
 record=identity(pid)
 if not record:continue
 record['seatbelt']=seatbelt.sandbox_check(pid,None,0)
 record['contentProcess']=False
 if record['executable'].startswith(bundle+'/') and record['executable'].endswith('/plugin-container'):
  args=subprocess.run(['/bin/ps','-ww','-p',str(pid),'-o','args='],text=True,capture_output=True,timeout=3)
  parts=args.stdout.split()
  # The separate plugin-container executable consumes its last argument as
  # GeckoProcessType (ipc/app/MozillaRuntimeMain.cpp). Unlike same-executable
  # child launches it does not require the browser's -contentproc flag.
  record['contentProcess']=args.returncode==0 and bool(parts) and parts[-1]=='tab'
 rows.append(record)
print(json.dumps({'observerPid':os.getpid(),'ownSeatbelt':seatbelt.sandbox_check(os.getpid(),None,0),'root':identity(root_pid),'processes':rows}))
