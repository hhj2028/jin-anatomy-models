# Generate original, tileable muscle/tendon textures for JIN Anatomy Studio.
# Replaces the UBC-derived (CC BY-NC-SA 4.0) images extracted by
#   node scripts/replace_ubc_muscle_textures.mjs extract <dir>
# For each <dir>/<sha>.jpg this writes <dir>/out/<sha>.jpg with the same size.
# Only a heavily blurred muscle-vs-tendon layout mask (where the UVs expect muscle
# belly and where tendon) and the two mean colours are taken from the source image;
# every fibre, streak and blotch is synthesized here from periodic sine noise.
param([Parameter(Mandatory=$true)][string]$Dir)
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class MuscleTexture {
  static double Smooth(double a,double b,double x){double t=Math.Max(0,Math.Min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
  static double Hash(int i,int seed){unchecked{uint h=(uint)(i*374761393+seed*668265263);h=(h^(h>>13))*1274126177u;return ((h^(h>>16))&0xffffff)/16777215.0;}}
  static float[] Blur(float[] m,int w,int h,int r){ // periodic box blur, 3 passes ~ gaussian
    float[] a=(float[])m.Clone(),b=new float[m.Length];
    for(int pass=0;pass<3;pass++){
      for(int y=0;y<h;y++){double s=0;for(int k=-r;k<=r;k++)s+=a[y*w+((k%w)+w)%w];for(int x=0;x<w;x++){b[y*w+x]=(float)(s/(2*r+1));s+=a[y*w+(x+r+1)%w]-a[y*w+((x-r)%w+w)%w];}}
      for(int x=0;x<w;x++){double s=0;for(int k=-r;k<=r;k++)s+=b[(((k%h)+h)%h)*w+x];for(int y=0;y<h;y++){a[y*w+x]=(float)(s/(2*r+1));s+=b[((y+r+1)%h)*w+x]-b[(((y-r)%h+h)%h)*w+x];}}
    }
    return a;
  }
  public static void Make(string src,string dst,bool normalMap,int seed){
    Bitmap input=new Bitmap(src);int w=input.Width,h=input.Height;
    Bitmap img=input.Clone(new Rectangle(0,0,w,h),PixelFormat.Format24bppRgb);input.Dispose();
    BitmapData d=img.LockBits(new Rectangle(0,0,w,h),ImageLockMode.ReadOnly,PixelFormat.Format24bppRgb);
    byte[] px=new byte[d.Stride*h];Marshal.Copy(d.Scan0,px,0,px.Length);int stride=d.Stride;img.UnlockBits(d);img.Dispose();
    float[] mask=new float[w*h];double[] mc=new double[4],tc=new double[4];double gx=0,gy=0;
    for(int y=0;y<h;y++)for(int x=0;x<w;x++){
      int i=y*stride+x*3;double B=px[i]/255.0,G=px[i+1]/255.0,R=px[i+2]/255.0;
      double t=normalMap?0:Smooth(.62,.82,G/Math.Max(R,.02));mask[y*w+x]=(float)t;
      if(t<.3){mc[0]+=R;mc[1]+=G;mc[2]+=B;mc[3]++;}else if(t>.7){tc[0]+=R;tc[1]+=G;tc[2]+=B;tc[3]++;}
      if(x+1<w&&y+1<h){int j=y*stride+(x+1)*3,k=(y+1)*stride+x*3;double L=R+G+B;gx+=Math.Abs(px[j]+px[j+1]+px[j+2]-L*255);gy+=Math.Abs(px[k]+px[k+1]+px[k+2]-L*255);}
    }
    double[] muscle=mc[3]>0?new[]{mc[0]/mc[3],mc[1]/mc[3],mc[2]/mc[3]}:new[]{.72,.36,.31};
    double[] tendon=tc[3]>0?new[]{tc[0]/tc[3],tc[1]/tc[3],tc[2]/tc[3]}:new[]{.93,.89,.85};
    bool vertical=gx>=gy; // fibres run perpendicular to the dominant luminance gradient
    if(!normalMap)mask=Blur(mask,w,h,Math.Max(8,w/64));
    int across=vertical?w:h,along=vertical?h:w,bundles=Math.Max(64,across/9);
    byte[] outPx=new byte[stride*h];
    for(int y=0;y<h;y++)for(int x=0;x<w;x++){
      double u=(vertical?x:y)/(double)across,v=(vertical?y:x)/(double)along;
      int bundle=(int)Math.Floor(u*bundles)%bundles;double inBundle=u*bundles-Math.Floor(u*bundles);
      double fib=0.55*Math.Sin(2*Math.PI*(137*u+Hash(1,seed)))+0.30*Math.Sin(2*Math.PI*(311*u+Hash(2,seed)))+0.15*Math.Sin(2*Math.PI*(587*u+Hash(3,seed)));
      double edge=Math.Pow(Math.Sin(Math.PI*inBundle),0.35);                       // dark seam between fascicles
      double tone=Hash(bundle,seed)-.5;                                              // per-fascicle shade
      double streak=Math.Sin(2*Math.PI*((2+(int)(Hash(bundle,seed+7)*3))*v+Hash(bundle,seed+9)));
      double blot=0.5*Math.Sin(2*Math.PI*(u*2+v*1+Hash(4,seed)))+0.5*Math.Sin(2*Math.PI*(u*1-v*3+Hash(5,seed)));
      int o=y*stride+x*3;
      if(normalMap){
        double slope=0.35*(0.55*137*Math.Cos(2*Math.PI*(137*u+Hash(1,seed)))+0.30*311*Math.Cos(2*Math.PI*(311*u+Hash(2,seed))))/400.0;
        double nx=vertical?-slope:0,ny=vertical?0:-slope,nz=1,len=Math.Sqrt(nx*nx+ny*ny+nz*nz);
        outPx[o+2]=(byte)Math.Round(255*(nx/len*.5+.5));outPx[o+1]=(byte)Math.Round(255*(ny/len*.5+.5));outPx[o]=(byte)Math.Round(255*(nz/len*.5+.5));continue;
      }
      double t=mask[y*w+x];
      double mShade=1+0.07*fib+0.10*tone+0.04*streak+0.05*blot-0.10*(1-edge);
      double tShade=1+0.04*fib+0.03*tone+0.02*streak-0.03*(1-edge);
      for(int c=0;c<3;c++){double val=(1-t)*muscle[c]*mShade+t*tendon[c]*tShade;outPx[o+2-c]=(byte)Math.Max(0,Math.Min(255,Math.Round(val*255)));}
    }
    Bitmap result=new Bitmap(w,h,PixelFormat.Format24bppRgb);BitmapData r=result.LockBits(new Rectangle(0,0,w,h),ImageLockMode.WriteOnly,PixelFormat.Format24bppRgb);
    Marshal.Copy(outPx,0,r.Scan0,outPx.Length);result.UnlockBits(r);
    ImageCodecInfo jpeg=Array.Find(ImageCodecInfo.GetImageEncoders(),e=>e.MimeType=="image/jpeg");
    EncoderParameters p=new EncoderParameters(1);p.Param[0]=new EncoderParameter(System.Drawing.Imaging.Encoder.Quality,72L);
    result.Save(dst,jpeg,p);result.Dispose();
  }
}
'@
$targets = Get-Content (Join-Path $Dir 'targets.json') -Raw | ConvertFrom-Json
$out = Join-Path $Dir 'out'
New-Item -ItemType Directory -Force $out | Out-Null
$seed = 11
foreach ($p in $targets.PSObject.Properties) {
  $seed++
  [MuscleTexture]::Make((Join-Path $Dir "$($p.Name).jpg"), (Join-Path $out "$($p.Name).jpg"), [bool]$p.Value.normal, $seed)
  "$($p.Value.name) -> out\$($p.Name.Substring(0,12)).jpg"
}
