import Script from "next/script";

export type TrackingConfig = {
  useGtm: boolean;
  gtmId: string | null;
  gtagId: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
};

/**
 * Renders GTM *or* direct gtag + Meta + TikTok (MVP: avoid double-counting — prefer one mode).
 */
export function TrackingHeadScripts(props: TrackingConfig) {
  const { useGtm, gtmId, gtagId, metaPixelId, tiktokPixelId } = props;

  if (useGtm && gtmId) {
    return (
      <Script
        id="gtm"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!=='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(
            gtmId,
          )});`,
        }}
      />
    );
  }

  return (
    <>
      {gtagId ? (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              gtagId,
            )}`}
            strategy="afterInteractive"
          />
          <Script id="ga-gtag" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config',${JSON.stringify(
              gtagId,
            )});`}
          </Script>
        </>
      ) : null}
      {metaPixelId ? (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(metaPixelId)});
fbq('track', 'PageView');`}
        </Script>
      ) : null}
      {tiktokPixelId ? (
        <Script id="ttq" strategy="afterInteractive">
          {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","hold","getPixel"];
  ttq.setAndDeploy=function(){};ttq.instance=function(i){return ttq[i]=ttq[i]||[]};
  for(var i=0;i<ttq.methods.length;i++)!function(n){ttq[n]=ttq[n]||function(){ttq.push([n].concat([].slice.call(arguments,0)))}}(ttq.methods[i]);
  var s=d.createElement("script");s.async=true;s.src="https://analytics.tiktok.com/i18n/pixel.js";
  var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a);
}(window, document, "ttq");
ttq.load(${JSON.stringify(tiktokPixelId)});ttq.page();`}
        </Script>
      ) : null}
    </>
  );
}

export function TrackingBodyNoscript({ gtmId }: { gtmId: string | null }) {
  if (!gtmId) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(
          gtmId,
        )}`}
        height="0"
        width="0"
        className="hidden"
        title="GTM"
      />
    </noscript>
  );
}
