plugins {
    id("com.android.application") version "9.1.0"
    id("com.google.gms.google-services") version "4.4.4"
}
android {
    namespace = "com.ffesports.tournament"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.ffesports.tournament"
        minSdk = 24
        targetSdk = 34
        versionCode = 301
        versionName = "3.0.1"
    }
    sourceSets.getByName("main") {
        manifest.srcFile("AndroidManifest.xml")
        java.setSrcDirs(listOf("src"))
        res.setSrcDirs(listOf("res"))
        assets.setSrcDirs(listOf("assets"))
    }
    signingConfigs {
        create("existing") {
            storeFile = file("release.keystore")
            storePassword = providers.gradleProperty("FF_STORE_PASSWORD").orNull
            keyAlias = "ffesports"
            keyPassword = providers.gradleProperty("FF_KEY_PASSWORD").orNull
        }
    }
    buildTypes { getByName("debug") { signingConfig = signingConfigs.getByName("existing") }; getByName("release") { signingConfig = signingConfigs.getByName("existing") } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.1.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("androidx.credentials:credentials:1.5.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.5.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
    implementation("androidx.webkit:webkit:1.14.0")
}
