package com.utoon.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Scanner;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Access the WebView from Capacitor Bridge
        WebView webView = getBridge().getWebView();

        // Set a custom WebViewClient to listen for URL changes and page finishes
        webView.setWebViewClient(new UtoonWebViewClient());
    }

    private class UtoonWebViewClient extends WebViewClient {
        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);

            // Logic Rule: If path contains /chapter-*/, inject the reader logic
            if (url != null && url.contains("/chapter-")) {
                injectReader(view);
            }
        }

        private void injectReader(WebView view) {
            // Sequence: jsPDF -> jsZip -> reader_logic (Order matters)
            injectAssetScript(view, "assets/jspdf.min.js");
            injectAssetScript(view, "assets/jszip.min.js");
            injectAssetScript(view, "assets/reader_logic.js");
        }

        private void injectAssetScript(WebView view, String assetPath) {
            try {
                // Read from bundled web assets
                Scanner scanner = new Scanner(getAssets().open("public/" + assetPath)).useDelimiter("\\A");
                String scriptBody = scanner.hasNext() ? scanner.next() : "";

                // Execute in the context of the current page
                view.evaluateJavascript(scriptBody, null);
            } catch (Exception e) {
                android.util.Log.e("UtoonInjection", "Failed to inject: " + assetPath, e);
            }
        }
    }
}
