package com.utoon.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import java.util.Scanner;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        webView.setWebViewClient(new UtoonWebViewClient());
    }

    private class UtoonWebViewClient extends WebViewClient {
        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (url != null && url.contains("/chapter-")) {
                injectReader(view);
            }
        }

        private void injectReader(WebView view) {
            injectAssetScript(view, "assets/jspdf.min.js");
            injectAssetScript(view, "assets/jszip.min.js");
            injectAssetScript(view, "assets/reader_logic.js");
        }

        private void injectAssetScript(WebView view, String assetPath) {
            try {
                Scanner scanner = new Scanner(getAssets().open("public/" + assetPath)).useDelimiter("\\A");
                String scriptBody = scanner.hasNext() ? scanner.next() : "";
                view.evaluateJavascript(scriptBody, null);
            } catch (Exception e) {
                android.util.Log.e("UtoonInjection", "Failed to inject: " + assetPath, e);
            }
        }
    }
}
