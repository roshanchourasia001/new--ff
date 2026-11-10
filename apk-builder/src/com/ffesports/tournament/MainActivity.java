package com.ffesports.tournament;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.os.Vibrator;
import android.view.KeyEvent;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.content.Intent;
import android.net.Uri;
import androidx.webkit.WebViewAssetLoader;
import androidx.credentials.*;
import androidx.credentials.exceptions.*;
import com.google.android.libraries.identity.googleid.*;
import com.google.firebase.auth.*;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private WebView webView;
    private CredentialManager credentials;
    private boolean signingIn;
    private ValueCallback<Uri[]> mFilePathCallback;
    private static final int FILECHOOSER_RESULTCODE = 101;

    private void reply(String id, String token, String error) {
        runOnUiThread(() -> webView.evaluateJavascript("window.onNativeAuthResult && window.onNativeAuthResult(" +
            JSONObject.quote(id) + "," + JSONObject.quote(token == null ? "" : token) + "," +
            JSONObject.quote(error == null ? "" : error) + ")", null));
    }

    private void returnToken(String id) {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null) { reply(id, "", ""); return; }
        user.getIdToken(false).addOnSuccessListener(result -> reply(id, result.getToken(), ""))
            .addOnFailureListener(e -> reply(id, "", "Session could not be refreshed. Please sign in again."));
    }

    private void googleLogin(String id) {
        if (signingIn) { reply(id, "", "Sign-in is already in progress."); return; }
        int resource = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
        String clientId = resource != 0 ? getString(resource) : "249570949978-kng4rs8lo80hc5hntvpifcpmfa7n59eh.apps.googleusercontent.com";
        signingIn = true;
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(clientId).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        credentials.getCredentialAsync(this, request, null, this::runOnUiThread,
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                public void onResult(GetCredentialResponse result) {
                    try {
                        GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(result.getCredential().getData());
                        final String idToken = google.getIdToken();
                        FirebaseAuth.getInstance().signInWithCredential(GoogleAuthProvider.getCredential(idToken, null))
                            .addOnSuccessListener(auth -> { signingIn = false; returnToken(id); })
                            .addOnFailureListener(e -> {
                                signingIn = false;
                                if (idToken != null && !idToken.isEmpty()) {
                                    reply(id, idToken, "");
                                } else {
                                    reply(id, "", "Google sign-in failed: " + e.getMessage());
                                }
                            });
                    } catch (Exception e) { signingIn = false; reply(id, "", "Google returned an invalid credential: " + e.getMessage()); }
                }
                public void onError(GetCredentialException e) {
                    signingIn = false;
                    String msg = (e instanceof GetCredentialCancellationException)
                        ? "Sign-in cancelled."
                        : ("Google sign-in unavailable: " + e.getMessage());
                    reply(id, "", msg);
                }
            });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        credentials = CredentialManager.create(this);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        // Hardware acceleration flags on Window
        Window window = getWindow();
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#FFFFFF"));
        window.setNavigationBarColor(Color.parseColor("#FFFFFF"));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            window.getDecorView().setSystemUiVisibility(flags);
        }

        webView = new WebView(this);
        setContentView(webView);

        // Crucial for touch interaction, tap detection, and keyboard input
        webView.setClickable(true);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus(View.FOCUS_DOWN);

        // Hardware accelerated rendering for buttery-smooth 60-120fps scrolling
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setLoadsImagesAutomatically(true);

        // Offscreen pre-rastering for instant, stutter-free scroll
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            settings.setOffscreenPreRaster(true);
        }
        settings.setEnableSmoothTransition(true);

        // Mobile responsive viewport settings (prevent desktop scaling and tap interception)
        settings.setUseWideViewPort(false);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        webView.setBackgroundColor(Color.parseColor("#FFFFFF"));

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("https://appassets.androidplatform.net/")) return false;
                if (url.startsWith("https://") || url.startsWith("http://")) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                }
                return true;
            }
        });

        WebView.setWebContentsDebuggingEnabled(true);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                android.util.Log.e("WebViewConsole", consoleMessage.message() + " -- Line "
                    + consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                }
                mFilePathCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    mFilePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        // Android Native Bridge
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        // Load offline packaged asset
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface public void signIn(String id) { runOnUiThread(() -> googleLogin(id)); }
        @JavascriptInterface public void getIdToken(String id) { runOnUiThread(() -> returnToken(id)); }
        @JavascriptInterface public void signOut(String id) {
            runOnUiThread(() -> {
                FirebaseAuth.getInstance().signOut();
                credentials.clearCredentialStateAsync(new ClearCredentialStateRequest(), null, MainActivity.this::runOnUiThread,
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        public void onResult(Void result) { reply(id, "", ""); }
                        public void onError(ClearCredentialException e) { reply(id, "", ""); }
                    });
            });
        }

        @JavascriptInterface
        public void showToast(final String toast) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void copyToClipboard(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ClipboardManager clipboard = (ClipboardManager) mContext.getSystemService(Context.CLIPBOARD_SERVICE);
                    ClipData clip = ClipData.newPlainText("FF Esports", text);
                    clipboard.setPrimaryClip(clip);
                    Toast.makeText(mContext, "Copied: " + text, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void openBrowser(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                        mContext.startActivity(intent);
                    } catch (Exception e) {
                        android.util.Log.e("FFEsports", "Failed to open browser: " + e.getMessage());
                    }
                }
            });
        }

        @JavascriptInterface
        public void vibrate(int milliseconds) {
            try {
                Vibrator v = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null) {
                    v.vibrate(milliseconds);
                }
            } catch (Exception e) {}
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mFilePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
