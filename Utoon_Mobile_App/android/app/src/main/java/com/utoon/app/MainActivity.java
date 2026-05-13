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
            // Inject everything on every page; the script handles context
            injectScript(view, "assets/jspdf.min.js");
            injectScript(view, "assets/jszip.min.js");
            injectScript(view, "assets/reader_logic.js");
        }

        private void injectScript(WebView view, String path) {
            try {
                Scanner s = new Scanner(getAssets().open("public/" + path)).useDelimiter("\\A");
                view.evaluateJavascript(s.hasNext() ? s.next() : "", null);
            } catch (Exception e) {}
        }
    }
}
