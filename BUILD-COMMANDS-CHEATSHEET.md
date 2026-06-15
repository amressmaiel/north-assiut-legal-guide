# أوامر التجميع السريعة

## GitHub

```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
git add .
git commit -m "Update latest phase"
git push origin main
```

## فحص تعارضات Git

```powershell
Get-ChildItem -Recurse -File | Select-String -Pattern "<<<<<<<",">>>>>>>" -ErrorAction SilentlyContinue
```

## Windows Desktop

```powershell
npm install
npm run desktop
npm run build:win
```

## iPhone / iPad على Mac

```bash
git clone https://github.com/amressmaiel/north-assiut-legal-guide.git
cd north-assiut-legal-guide
npm install
npm run ios:doctor
npm run ios:add
npm run ios:sync
npm run ios:open
```

## Android

```powershell
npm install
npm run android:doctor
npm run android:add
npm run android:sync
npm run android:open
```
